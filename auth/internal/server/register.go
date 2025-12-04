package server

import (
	"net/http"
	"strings"

	"github.com/flaviogonzalez/e-commerce/auth/internal/helpers"
	"github.com/flaviogonzalez/e-commerce/auth/models"
	"github.com/flaviogonzalez/e-commerce/contracts"
	"golang.org/x/crypto/bcrypt"
)

func (s *Server) RegisterHandler(w http.ResponseWriter, r *http.Request) { // create user
	var registerPayload contracts.AuthRegisterRequest

	err := helpers.ReadJSON(w, r, &registerPayload)
	if err != nil {
		helpers.ErrorJSON(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	email := strings.ToLower(strings.TrimSpace(registerPayload.Email))
	if email == "" || registerPayload.Password == "" {
		helpers.ErrorJSON(w, http.StatusBadRequest, "Name, email, and password are required")
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(registerPayload.Password), bcrypt.DefaultCost)
	if err != nil {
		helpers.ErrorJSON(w, http.StatusInternalServerError, "Error processing password")
		return
	}

	_, err = s.Repository.CreateUser(r.Context(), models.CreateUserParams{
		Email:        registerPayload.Email,
		PasswordHash: string(passwordHash),
	})
	if err != nil {
		helpers.ErrorJSON(w, http.StatusInternalServerError, "Error creating user: "+err.Error())
		return
	}

	var response contracts.AuthRegisterResponse
	response.Error = false
	response.Message = "User registered successfully"

	helpers.WriteJSON(w, http.StatusOK, response, nil)
}
