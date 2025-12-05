package event

import (
	"fmt"
	"log"
	"math"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

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
