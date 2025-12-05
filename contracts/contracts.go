package contracts

import "encoding/json"

type Payload struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
}

// Event messaging types
type EventPayload struct {
	Name string          `json:"name"`
	Data json.RawMessage `json:"data"`
}

type TopicPayload struct {
	Name  string       `json:"name"`
	Event EventPayload `json:"event"`
}

// Auth types
type AuthRegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Policy   int32  `json:"policy"`
}

type AuthRegisterResponse struct {
	Payload
}

type AuthLoginRequest struct { // credentials method
	Email    string `json:"email"`
	Password string `json:"password"`
}
