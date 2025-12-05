package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/Flaviogonzalez/e-commerce/log/internal/consumer"
	"github.com/Flaviogonzalez/e-commerce/log/internal/storage"
)

func main() {
	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "kafka:9092"
	}

	kafkaTopic := os.Getenv("KAFKA_TOPIC")
	if kafkaTopic == "" {
		kafkaTopic = "logs"
	}

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		mongoURI = "mongodb://mongo:27017"
	}

	mongoDB := os.Getenv("MONGO_DB")
	if mongoDB == "" {
		mongoDB = "logs"
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize MongoDB storage
	store, err := storage.NewMongoDB(ctx, mongoURI, mongoDB)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer store.Close(ctx)

	log.Println("Connected to MongoDB")

	// Initialize Kafka consumer
	c := consumer.New(consumer.Config{
		Brokers:    []string{kafkaBrokers},
		Topic:      kafkaTopic,
		GroupID:    "log-service",
		Storage:    store,
		Workers:    10,
		BatchSize:  100,
		BatchDelay: 500, // ms
	})

	// Handle shutdown gracefully
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Println("Shutting down...")
		cancel()
	}()

	log.Println("Log service starting, consuming from topic:", kafkaTopic)
	if err := c.Start(ctx); err != nil {
		log.Fatal("Consumer error:", err)
	}
}
