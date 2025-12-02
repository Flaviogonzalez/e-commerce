package auth

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterResponse struct {
	Error bool   `json:"error"`
	Msg   string `json:"msg"`
}
