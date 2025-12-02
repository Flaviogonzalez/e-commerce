package helpers

import (
	"encoding/json"
	"maps"
	"net/http"

	"github.com/flaviogonzalez/e-commerce/contracts"
)

func ReadJSON(w http.ResponseWriter, r *http.Request, data any) error {
	return json.NewDecoder(r.Body).Decode(data)
}

func ErrorJSON(w http.ResponseWriter, errorCode int, message string) {
	if errorCode == 0 {
		errorCode = http.StatusInternalServerError
	}

	payload := contracts.Payload{
		Error:   true,
		Message: message,
	}

	w.Header().Set("Content-Type", "application/json")
	data, err := json.Marshal(payload)
	if err != nil {

		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(`{"error": true, "message": "Internal server errorr"}`))
		return
	}

	w.WriteHeader(errorCode)
	w.Write(data)
}

func WriteJSON(w http.ResponseWriter, status int, data any, headers http.Header) error {
	js, err := json.Marshal(data)
	if err != nil {
		return err
	}

	maps.Copy(w.Header(), headers)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(js)
	return nil
}
