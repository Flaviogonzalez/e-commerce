package consumer

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/Flaviogonzalez/e-commerce/contracts"
	"github.com/Flaviogonzalez/e-commerce/log/internal/storage"
	"github.com/segmentio/kafka-go"
)

type Storage interface {
	InsertMany(ctx context.Context, entries []contracts.LogEntry) error
}

type Consumer struct {
	reader     *kafka.Reader
	storage    Storage
	workers    int
	batchSize  int
	batchDelay time.Duration
	alerter    *Alerter
}

type Config struct {
	Brokers    []string
	Topic      string
	GroupID    string
	Storage    *storage.MongoDB
	Workers    int
	BatchSize  int
	BatchDelay int // milliseconds
}

func New(cfg Config) *Consumer {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:        cfg.Brokers,
		Topic:          cfg.Topic,
		GroupID:        cfg.GroupID,
		MinBytes:       10e3, // 10KB
		MaxBytes:       10e6, // 10MB
		CommitInterval: time.Second,
	})

	workers := cfg.Workers
	if workers <= 0 {
		workers = 10
	}

	batchSize := cfg.BatchSize
	if batchSize <= 0 {
		batchSize = 100
	}

	batchDelay := time.Duration(cfg.BatchDelay) * time.Millisecond
	if batchDelay <= 0 {
		batchDelay = 500 * time.Millisecond
	}

	return &Consumer{
		reader:     reader,
		storage:    cfg.Storage,
		workers:    workers,
		batchSize:  batchSize,
		batchDelay: batchDelay,
		alerter:    NewAlerter(),
	}
}

func (c *Consumer) Start(ctx context.Context) error {
	// Batch channel
	batch := make(chan contracts.LogEntry, c.batchSize*2)

	// Start batch writer
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		c.batchWriter(ctx, batch)
	}()

	// Read messages
	for {
		msg, err := c.reader.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				close(batch)
				wg.Wait()
				return nil
			}
			log.Printf("Read error: %v", err)
			continue
		}

		var entry contracts.LogEntry
		if err := json.Unmarshal(msg.Value, &entry); err != nil {
			log.Printf("Unmarshal error: %v", err)
			continue
		}

		// Check for alerts
		c.alerter.Check(entry)

		select {
		case batch <- entry:
		case <-ctx.Done():
			close(batch)
			wg.Wait()
			return nil
		}
	}
}

func (c *Consumer) batchWriter(ctx context.Context, batch <-chan contracts.LogEntry) {
	entries := make([]contracts.LogEntry, 0, c.batchSize)
	ticker := time.NewTicker(c.batchDelay)
	defer ticker.Stop()

	flush := func() {
		if len(entries) == 0 {
			return
		}

		if err := c.storage.InsertMany(ctx, entries); err != nil {
			log.Printf("Insert error: %v", err)
		} else {
			log.Printf("Inserted %d log entries", len(entries))
		}

		entries = entries[:0]
	}

	for {
		select {
		case entry, ok := <-batch:
			if !ok {
				flush()
				return
			}
			entries = append(entries, entry)
			if len(entries) >= c.batchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		case <-ctx.Done():
			flush()
			return
		}
	}
}

func (c *Consumer) Close() error {
	return c.reader.Close()
}
