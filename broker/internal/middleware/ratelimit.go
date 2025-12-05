package middleware

import (
	"net/http"
	"sync"
	"time"
)

type RateLimiter struct {
	mu       sync.RWMutex
	requests map[string]*clientState
	rate     int           // requests per window
	window   time.Duration // time window
	cleanup  time.Duration // cleanup interval
}

type clientState struct {
	count       int
	windowStart time.Time
}

func NewRateLimiter(rate int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string]*clientState),
		rate:     rate,
		window:   window,
		cleanup:  window * 2,
	}
	go rl.cleanupLoop()
	return rl
}

func (rl *RateLimiter) cleanupLoop() {
	ticker := time.NewTicker(rl.cleanup)
	defer ticker.Stop()

	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, state := range rl.requests {
			if now.Sub(state.windowStart) > rl.window {
				delete(rl.requests, key)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	state, exists := rl.requests[key]

	if !exists || now.Sub(state.windowStart) > rl.window {
		rl.requests[key] = &clientState{
			count:       1,
			windowStart: now,
		}
		return true
	}

	if state.count >= rl.rate {
		return false
	}

	state.count++
	return true
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Use IP + path as key for per-endpoint rate limiting
		key := r.RemoteAddr + ":" + r.URL.Path

		if !rl.Allow(key) {
			w.Header().Set("Retry-After", "1")
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// NewRateLimiterPathOnly creates a rate limiter that keys only on path (for testing)
func NewRateLimiterPathOnly(rate int, window time.Duration) *RateLimiter {
	return NewRateLimiter(rate, window)
}

func (rl *RateLimiter) MiddlewarePathOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Use only path as key (all clients share the limit)
		key := r.URL.Path

		if !rl.Allow(key) {
			w.Header().Set("Retry-After", "1")
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}
