package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/Flaviogonzalez/e-commerce/broker/internal/event"
	"github.com/Flaviogonzalez/e-commerce/broker/internal/server"
	"github.com/Flaviogonzalez/e-commerce/contracts/logger"
)

const (
	defaultPort     = "8080"
	defaultExchange = "app_exchange"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@rabbitmq:5672/"
	}

	exchange := os.Getenv("RABBITMQ_EXCHANGE")
	if exchange == "" {
		exchange = defaultExchange
	}

	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "kafka:9092"
	}

	// Initialize logger
	appLogger, err := logger.New(logger.Config{
		Service:      "broker",
		KafkaBrokers: strings.Split(kafkaBrokers, ","),
		Topic:        "logs",
	})
	if err != nil {
		log.Printf("Warning: Failed to initialize logger: %v", err)
	} else {
		defer appLogger.Close()
	}

	// Connect to RabbitMQ
	conn, err := event.ConnectToRabbit(rabbitURL)
	if err != nil {
		if appLogger != nil {
			appLogger.Fatal("Failed to connect to RabbitMQ", logger.WithError(err))
		}
		log.Fatal("Failed to connect to RabbitMQ:", err)
	}
	defer conn.Close()

	// Create emitter
	emitter, err := event.NewEmitter(conn, exchange)
	if err != nil {
		if appLogger != nil {
			appLogger.Fatal("Failed to create emitter", logger.WithError(err))
		}
		log.Fatal("Failed to create emitter:", err)
	}
	defer emitter.Close()

	// Create server
	srv := server.NewServer(emitter, appLogger)

	if appLogger != nil {
		appLogger.Info("Broker service starting", logger.WithField("port", port))
	}
	log.Printf("Broker service starting on port %s", port)

	if err := http.ListenAndServe(":"+port, srv.Routes()); err != nil {
		if appLogger != nil {
			appLogger.Fatal("Server failed", logger.WithError(err))
		}
		log.Fatal("Server failed:", err)
	}
}
