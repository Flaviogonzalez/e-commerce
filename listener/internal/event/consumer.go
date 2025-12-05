package event

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"

	"github.com/Flaviogonzalez/e-commerce/contracts"
	amqp "github.com/rabbitmq/amqp091-go"
)

// Handler is a function that processes an event and returns a response
type Handler func(data json.RawMessage) ([]byte, error)

// HandlerMap maps event names to their handlers
type HandlerMap map[string]Handler

type Consumer struct {
	conn       *amqp.Connection
	exchange   string
	handlers   HandlerMap
	workerPool int
	mu         sync.RWMutex
}

type ConsumerConfig struct {
	Connection *amqp.Connection
	Exchange   string
	Handlers   HandlerMap
	WorkerPool int // number of concurrent workers (default: 10)
}

func NewConsumer(cfg ConsumerConfig) *Consumer {
	workers := cfg.WorkerPool
	if workers <= 0 {
		workers = 10
	}

	return &Consumer{
		conn:       cfg.Connection,
		exchange:   cfg.Exchange,
		handlers:   cfg.Handlers,
		workerPool: workers,
	}
}

func (c *Consumer) Setup() error {
	ch, err := c.conn.Channel()
	if err != nil {
		return fmt.Errorf("open channel: %w", err)
	}
	defer ch.Close()

	return ch.ExchangeDeclare(
		c.exchange,
		"topic",
		true,  // durable
		false, // auto-deleted
		false, // internal
		false, // no-wait
		nil,
	)
}

// Listen starts consuming messages for the given topics
func (c *Consumer) Listen(topics []string) error {
	ch, err := c.conn.Channel()
	if err != nil {
		return fmt.Errorf("open channel: %w", err)
	}
	defer ch.Close()

	// Set prefetch count for fair dispatch
	if err := ch.Qos(c.workerPool, 0, false); err != nil {
		return fmt.Errorf("set qos: %w", err)
	}

	// Declare queue
	q, err := ch.QueueDeclare(
		"listener_queue", // named queue for persistence
		true,             // durable
		false,            // auto-delete
		false,            // exclusive
		false,            // no-wait
		nil,
	)
	if err != nil {
		return fmt.Errorf("declare queue: %w", err)
	}

	// Bind queue to topics
	for _, topic := range topics {
		if err := ch.QueueBind(q.Name, topic, c.exchange, false, nil); err != nil {
			return fmt.Errorf("bind queue to %s: %w", topic, err)
		}
		log.Printf("Bound to topic: %s", topic)
	}

	// Start consuming
	msgs, err := ch.Consume(
		q.Name,
		"",    // consumer tag
		false, // auto-ack (manual for reliability)
		false, // exclusive
		false, // no-local
		false, // no-wait
		nil,
	)
	if err != nil {
		return fmt.Errorf("consume: %w", err)
	}

	log.Printf("Listener started with %d workers, waiting for messages...", c.workerPool)

	// Worker pool using semaphore pattern
	sem := make(chan struct{}, c.workerPool)
	var wg sync.WaitGroup

	for msg := range msgs {
		sem <- struct{}{} // acquire
		wg.Add(1)

		go func(d amqp.Delivery) {
			defer func() {
				<-sem // release
				wg.Done()
			}()

			c.processMessage(ch, d)
		}(msg)
	}

	wg.Wait()
	return nil
}

func (c *Consumer) processMessage(ch *amqp.Channel, msg amqp.Delivery) {
	var payload contracts.EventPayload
	if err := json.Unmarshal(msg.Body, &payload); err != nil {
		log.Printf("Failed to unmarshal message: %v", err)
		msg.Nack(false, false) // don't requeue malformed messages
		return
	}

	log.Printf("Processing event: %s, correlationId: %s", payload.Name, msg.CorrelationId)

	c.mu.RLock()
	handler, ok := c.handlers[payload.Name]
	c.mu.RUnlock()

	if !ok {
		log.Printf("No handler for event: %s", payload.Name)
		msg.Nack(false, false)
		return
	}

	// Execute handler
	response, err := handler(payload.Data)
	if err != nil {
		log.Printf("Handler error for %s: %v", payload.Name, err)
		msg.Nack(false, true) // requeue on handler error
		return
	}

	// Send response if ReplyTo is set
	if msg.ReplyTo != "" {
		err = ch.Publish(
			"",          // default exchange
			msg.ReplyTo, // routing key = reply queue
			false,
			false,
			amqp.Publishing{
				ContentType:   "application/json",
				CorrelationId: msg.CorrelationId,
				Body:          response,
			},
		)
		if err != nil {
			log.Printf("Failed to publish response: %v", err)
			msg.Nack(false, true)
			return
		}

		log.Printf("Response sent for %s, correlationId: %s", payload.Name, msg.CorrelationId)
	}

	msg.Ack(false)
}

// RegisterHandler adds or updates a handler at runtime
func (c *Consumer) RegisterHandler(name string, handler Handler) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.handlers[name] = handler
}
