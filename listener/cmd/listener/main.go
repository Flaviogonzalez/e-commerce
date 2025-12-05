package main

import (
	"log"
	"os"

	"github.com/Flaviogonzalez/e-commerce/listener/internal/event"
	"github.com/Flaviogonzalez/e-commerce/listener/internal/handlers"
)

const defaultExchange = "app_exchange"

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@rabbitmq:5672/"
	}

	exchange := os.Getenv("RABBITMQ_EXCHANGE")
	if exchange == "" {
		exchange = defaultExchange
	}

	authURL := os.Getenv("AUTH_SERVICE_URL")
	if authURL == "" {
		authURL = "http://auth:8080"
	}

	// Connect to RabbitMQ
	conn, err := event.ConnectToRabbit(rabbitURL)
	if err != nil {
		log.Fatal("Failed to connect to RabbitMQ:", err)
	}
	defer conn.Close()

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authURL)

	// Create consumer with handlers
	consumer := event.NewConsumer(event.ConsumerConfig{
		Connection: conn,
		Exchange:   exchange,
		WorkerPool: 10,
		Handlers: event.HandlerMap{
			"get_users": authHandler.GetUsers,
			"get_user":  authHandler.GetUser,
			"register":  authHandler.Register,
		},
	})

	// Setup exchange
	if err := consumer.Setup(); err != nil {
		log.Fatal("Failed to setup consumer:", err)
	}

	// Define topics to listen to
	topics := []string{
		"auth.#", // all auth events
	}

	log.Println("Listener service starting...")
	if err := consumer.Listen(topics); err != nil {
		log.Fatal("Listener failed:", err)
	}
}
