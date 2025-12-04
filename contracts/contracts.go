package contracts

type Payload struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
}

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
