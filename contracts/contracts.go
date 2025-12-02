package contracts

type Payload struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
}

type AuthRegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthRegisterResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
}
