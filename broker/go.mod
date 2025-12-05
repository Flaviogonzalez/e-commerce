module github.com/Flaviogonzalez/e-commerce/broker

go 1.25.2

require (
	github.com/Flaviogonzalez/e-commerce/contracts v0.0.0
	github.com/go-chi/chi/v5 v5.2.3
	github.com/go-chi/cors v1.2.2
	github.com/google/uuid v1.6.0
	github.com/rabbitmq/amqp091-go v1.10.0
)

replace github.com/Flaviogonzalez/e-commerce/contracts => ../contracts
