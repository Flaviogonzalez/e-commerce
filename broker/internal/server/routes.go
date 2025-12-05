package server

import (
	"net/http"
	"time"

	brokermw "github.com/Flaviogonzalez/e-commerce/broker/internal/middleware"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func (s *Server) Routes() http.Handler {
	mux := chi.NewRouter()

	mux.Use(middleware.Recoverer)
	mux.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Rate limiter: 1000 requests per second per IP+endpoint
	rateLimiter := brokermw.NewRateLimiter(1000, time.Second)
	mux.Use(rateLimiter.Middleware)

	// Add logging middleware
	if s.Logger != nil {
		mux.Use(s.Logger.Middleware)
	} else {
		mux.Use(middleware.Logger)
	}

	mux.Route("/api/v1", func(r chi.Router) {
		// Auth routes
		r.Get("/users", s.GetUsersHandler)
		r.Get("/users/{id}", s.GetUserHandler)
		r.Post("/register", s.RegisterHandler)
	})

	return mux
}
