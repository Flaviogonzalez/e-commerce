package event

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/Flaviogonzalez/e-commerce/contracts"
	"github.com/google/uuid"
	amqp "github.com/rabbitmq/amqp091-go"
)

// Push sends an event to RabbitMQ and waits for a response
func (e *Emitter) Push(ctx context.Context, w http.ResponseWriter, payload contracts.TopicPayload) error {
	e.mu.RLock()
	ch := e.channel
	e.mu.RUnlock()

	if ch == nil {
		return fmt.Errorf("channel not initialized")
	}

	body, err := json.Marshal(payload.Event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	// Declare exclusive reply queue
	replyQueue, err := ch.QueueDeclare(
		"",    // auto-generate name
		false, // durable
		true,  // auto-delete
		true,  // exclusive
		false, // no-wait
		nil,
	)
	if err != nil {
		return fmt.Errorf("declare reply queue: %w", err)
	}

	correlationID := uuid.New().String()

	// Set up consumer before publishing to avoid race
	replyChan := make(chan []byte, 1)
	errChan := make(chan error, 1)

	go func() {
		msgs, err := ch.Consume(
			replyQueue.Name,
			"",    // consumer tag
			true,  // auto-ack
			true,  // exclusive
			false, // no-local
			false, // no-wait
			nil,
		)
		if err != nil {
			errChan <- fmt.Errorf("consume reply: %w", err)
			return
		}

		for msg := range msgs {
			if msg.CorrelationId == correlationID {
				replyChan <- msg.Body
				return
			}
		}
	}()

	// Publish message
	err = ch.PublishWithContext(
		ctx,
		e.exchange,
		payload.Name, // routing key = topic
		false,        // mandatory
		false,        // immediate
		amqp.Publishing{
			ContentType:   "application/json",
			CorrelationId: correlationID,
			ReplyTo:       replyQueue.Name,
			Body:          body,
		},
	)
	if err != nil {
		return fmt.Errorf("publish: %w", err)
	}

	// Wait for response with timeout
	timeout := 30 * time.Second
	select {
	case response := <-replyChan:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, err = w.Write(response)
		return err
	case err := <-errChan:
		return err
	case <-time.After(timeout):
		return fmt.Errorf("timeout waiting for response")
	case <-ctx.Done():
		return ctx.Err()
	}
}

// PushAsync sends an event without waiting for response (fire-and-forget)
func (e *Emitter) PushAsync(ctx context.Context, payload contracts.TopicPayload) error {
	e.mu.RLock()
	ch := e.channel
	e.mu.RUnlock()

	if ch == nil {
		return fmt.Errorf("channel not initialized")
	}

	body, err := json.Marshal(payload.Event)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	return ch.PublishWithContext(
		ctx,
		e.exchange,
		payload.Name,
		false,
		false,
		amqp.Publishing{
			ContentType: "application/json",
			Body:        body,
		},
	)
}
