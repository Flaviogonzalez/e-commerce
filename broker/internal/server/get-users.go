package server

import (
	"encoding/json"
	"net/http"

	"github.com/Flaviogonzalez/e-commerce/contracts"
	"github.com/go-chi/chi/v5"
)

func (s *Server) GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	payload := contracts.TopicPayload{
		Name: "auth.get_users",
		Event: contracts.EventPayload{
			Name: "get_users",
			Data: nil,
		},
	}

	if err := s.Emitter.Push(r.Context(), w, payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Server) GetUserHandler(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "id")

	data, _ := json.Marshal(map[string]string{"id": userID})

	payload := contracts.TopicPayload{
		Name: "auth.get_user",
		Event: contracts.EventPayload{
			Name: "get_user",
			Data: data,
		},
	}

	if err := s.Emitter.Push(r.Context(), w, payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
