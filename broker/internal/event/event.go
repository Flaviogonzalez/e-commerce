package event

import (
	"fmt"
	"log"
	"math"
	"sync"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type Emitter struct {
	conn     *amqp.Connection
	exchange string
	mu       sync.RWMutex
	channel  *amqp.Channel
}

func ConnectToRabbit(url string) (*amqp.Connection, error) {
	var counts int64
	var backoff time.Duration

	for {
		connection, err := amqp.Dial(url)
		if err != nil {
			log.Printf("RabbitMQ not ready, attempt %d, retrying...", counts+1)
			counts++
		} else {
			log.Println("Connected to RabbitMQ")
			return connection, nil
		}

		if counts > 10 {
			return nil, fmt.Errorf("failed to connect to RabbitMQ after %d attempts", counts)
		}

		backoff = time.Duration(math.Pow(float64(counts), 2)) * time.Second
		time.Sleep(backoff)
	}
}

func NewEmitter(conn *amqp.Connection, exchange string) (*Emitter, error) {
	e := &Emitter{
		conn:     conn,
		exchange: exchange,
	}

	if err := e.setup(); err != nil {
		return nil, err
	}

	return e, nil
}

func (e *Emitter) setup() error {
	ch, err := e.conn.Channel()
	if err != nil {
		return fmt.Errorf("open channel: %w", err)
	}

	err = ch.ExchangeDeclare(
		e.exchange,
		"topic",
		true,  // durable
		false, // auto-deleted
		false, // internal
		false, // no-wait
		nil,
	)
	if err != nil {
		ch.Close()
		return fmt.Errorf("declare exchange: %w", err)
	}

	e.channel = ch
	return nil
}

func (e *Emitter) Close() error {
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.channel != nil {
		return e.channel.Close()
	}
	return nil
}
