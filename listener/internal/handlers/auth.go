package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type AuthHandler struct {
	client  *http.Client
	baseURL string
}

func NewAuthHandler(baseURL string) *AuthHandler {
	return &AuthHandler{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		baseURL: baseURL,
	}
}

func (h *AuthHandler) GetUsers(data json.RawMessage) ([]byte, error) {
	return h.forward("GET", "/users", nil)
}

func (h *AuthHandler) GetUser(data json.RawMessage) ([]byte, error) {
	var req struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(data, &req); err != nil {
		return nil, fmt.Errorf("unmarshal request: %w", err)
	}

	return h.forward("GET", "/users/"+req.ID, nil)
}

func (h *AuthHandler) Register(data json.RawMessage) ([]byte, error) {
	return h.forward("POST", "/register", data)
}

func (h *AuthHandler) forward(method, path string, body json.RawMessage) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		reqBody = bytes.NewReader(body)
	}

	req, err := http.NewRequest(method, h.baseURL+path, reqBody)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("do request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	return respBody, nil
}
