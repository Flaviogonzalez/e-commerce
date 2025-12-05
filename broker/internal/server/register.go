package server

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/Flaviogonzalez/e-commerce/contracts"
)

func (s *Server) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	payload := contracts.TopicPayload{
		Name: "auth.register",
		Event: contracts.EventPayload{
			Name: "register",
			Data: json.RawMessage(body),
		},
	}

	if err := s.Emitter.Push(r.Context(), w, payload); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
