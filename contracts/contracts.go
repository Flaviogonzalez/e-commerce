package contracts

import (
	"encoding/json"
	"time"
)

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

// Log types
type LogLevel string

const (
	LogDebug LogLevel = "DEBUG"
	LogInfo  LogLevel = "INFO"
	LogWarn  LogLevel = "WARN"
	LogError LogLevel = "ERROR"
	LogFatal LogLevel = "FATAL"
)

type LogEntry struct {
	ID         string                 `json:"id" bson:"_id,omitempty"`
	Timestamp  time.Time              `json:"timestamp" bson:"timestamp"`
	Level      LogLevel               `json:"level" bson:"level"`
	Service    string                 `json:"service" bson:"service"`
	TraceID    string                 `json:"trace_id,omitempty" bson:"trace_id,omitempty"`
	SpanID     string                 `json:"span_id,omitempty" bson:"span_id,omitempty"`
	Message    string                 `json:"message" bson:"message"`
	Data       map[string]interface{} `json:"data,omitempty" bson:"data,omitempty"`
	Error      string                 `json:"error,omitempty" bson:"error,omitempty"`
	StackTrace string                 `json:"stack_trace,omitempty" bson:"stack_trace,omitempty"`
	Duration   int64                  `json:"duration_ms,omitempty" bson:"duration_ms,omitempty"`
	HTTPMethod string                 `json:"http_method,omitempty" bson:"http_method,omitempty"`
	HTTPPath   string                 `json:"http_path,omitempty" bson:"http_path,omitempty"`
	HTTPStatus int                    `json:"http_status,omitempty" bson:"http_status,omitempty"`
	UserID     string                 `json:"user_id,omitempty" bson:"user_id,omitempty"`
	IP         string                 `json:"ip,omitempty" bson:"ip,omitempty"`
	UserAgent  string                 `json:"user_agent,omitempty" bson:"user_agent,omitempty"`
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
