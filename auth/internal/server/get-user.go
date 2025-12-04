package server

import (
	"database/sql"
	"net/http"

	"github.com/flaviogonzalez/e-commerce/auth/internal/helpers"
	"github.com/google/uuid"
)

func (s *Server) GetUserHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	if idStr == "" {
		helpers.ErrorJSON(w, http.StatusBadRequest, "Missing user ID")
		return
	}

	id, err := uuid.Parse(idStr)
	if err != nil {
		helpers.ErrorJSON(w, http.StatusBadRequest, "Invalid user ID format")
		return
	}

	user, err := s.Repository.GetUserByID(r.Context(), id)
	if err != nil {
		if err == sql.ErrNoRows {
			helpers.ErrorJSON(w, http.StatusNotFound, "User not found")
			return
		}
		helpers.ErrorJSON(w, http.StatusInternalServerError, "Error fetching user: "+err.Error())
		return
	}

	helpers.WriteJSON(w, http.StatusOK, user, nil)
}
