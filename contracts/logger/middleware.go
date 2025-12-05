package logger

import (
	"net/http"
	"time"

	"github.com/google/uuid"
)

// Middleware creates an HTTP middleware for request logging
func (l *Logger) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Generate trace ID if not present
		traceID := r.Header.Get("X-Trace-ID")
		if traceID == "" {
			traceID = uuid.New().String()
		}

		// Wrap response writer to capture status
		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}

		// Add trace ID to response headers
		w.Header().Set("X-Trace-ID", traceID)

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)

		l.LogRequest(
			r.Method,
			r.URL.Path,
			wrapped.status,
			duration,
			WithTraceID(traceID),
			WithUser("", r.RemoteAddr, r.UserAgent()),
		)
	})
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
