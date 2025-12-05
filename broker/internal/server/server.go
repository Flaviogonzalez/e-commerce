package server

import "github.com/Flaviogonzalez/e-commerce/broker/internal/event"

type Server struct {
	Emitter *event.Emitter
}

func NewServer(emitter *event.Emitter) *Server {
	return &Server{
		Emitter: emitter,
	}
}
