package server

import (
	"github.com/Flaviogonzalez/e-commerce/broker/internal/event"
	"github.com/Flaviogonzalez/e-commerce/contracts/logger"
)

type Server struct {
	Emitter *event.Emitter
	Logger  *logger.Logger
}

func NewServer(emitter *event.Emitter, log *logger.Logger) *Server {
	return &Server{
		Emitter: emitter,
		Logger:  log,
	}
}
