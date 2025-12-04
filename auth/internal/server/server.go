package server

import (
	"database/sql"

	"github.com/flaviogonzalez/e-commerce/auth/internal/repository"
)

type Server struct {
	Repository *repository.Repository
}

func NewServer(db *sql.DB) *Server {
	return &Server{
		Repository: repository.NewRepository(db),
	}
}
