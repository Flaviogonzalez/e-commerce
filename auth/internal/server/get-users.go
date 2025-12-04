package server

import (
	"net/http"

	"github.com/flaviogonzalez/e-commerce/auth/internal/helpers"
	"github.com/flaviogonzalez/e-commerce/auth/models"
)

func (s *Server) GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	users, err := s.Repository.ListUsers(r.Context(), models.ListUsersParams{
		Limit:  100,
		Offset: 0,
	})
	if err != nil {
		helpers.ErrorJSON(w, http.StatusInternalServerError, "Error fetching users: "+err.Error())
		return
	}

	if users == nil {
		users = []models.ListUsersRow{}
	}

	helpers.WriteJSON(w, http.StatusOK, users, nil)
}
