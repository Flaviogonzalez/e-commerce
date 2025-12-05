package main

import (
	"log"
	"net/http"
	"os"

	"github.com/Flaviogonzalez/e-commerce/broker/internal/event"
	"github.com/Flaviogonzalez/e-commerce/broker/internal/server"
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

	// Connect to RabbitMQ
	conn, err := event.ConnectToRabbit(rabbitURL)
	if err != nil {
		log.Fatal("Failed to connect to RabbitMQ:", err)
	}
	defer conn.Close()

	// Create emitter
	emitter, err := event.NewEmitter(conn, exchange)
	if err != nil {
		log.Fatal("Failed to create emitter:", err)
	}
	defer emitter.Close()

	// Create server
	srv := server.NewServer(emitter)

	log.Printf("Broker service starting on port %s", port)
	if err := http.ListenAndServe(":"+port, srv.Routes()); err != nil {
		log.Fatal("Server failed:", err)
	}
}
