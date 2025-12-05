module github.com/Flaviogonzalez/e-commerce/broker

go 1.25.2

require (
	github.com/Flaviogonzalez/e-commerce/contracts v0.0.0
	github.com/go-chi/chi/v5 v5.2.3
	github.com/go-chi/cors v1.2.2
	github.com/google/uuid v1.6.0
	github.com/rabbitmq/amqp091-go v1.10.0
)

require (
	github.com/klauspost/compress v1.15.9 // indirect
	github.com/pierrec/lz4/v4 v4.1.15 // indirect
	github.com/segmentio/kafka-go v0.4.49 // indirect
)

replace github.com/Flaviogonzalez/e-commerce/contracts => ../contracts
