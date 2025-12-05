package server

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Flaviogonzalez/e-commerce/broker/internal/middleware"
)

// MockEmitter simulates RabbitMQ emitter for testing
type MockEmitter struct {
	delay time.Duration
}

func (m *MockEmitter) Push(ctx interface{}, w http.ResponseWriter, payload interface{}) error {
	if m.delay > 0 {
		time.Sleep(m.delay)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`[{"id":"test-user"}]`))
	return nil
}

func TestConcurrentGetUsers(t *testing.T) {
	tests := []struct {
		name            string
		totalRequests   int
		concurrency     int
		rateLimit       int
		rateLimitWindow time.Duration
		emitterDelay    time.Duration
	}{
		{
			name:          "100_concurrent_no_rate_limit",
			totalRequests: 100,
			concurrency:   100,
			rateLimit:     0, // disabled
			emitterDelay:  time.Millisecond,
		},
		{
			name:          "500_concurrent_no_rate_limit",
			totalRequests: 500,
			concurrency:   50,
			rateLimit:     0,
			emitterDelay:  time.Millisecond,
		},
		{
			name:            "1000_requests_with_rate_limit_100",
			totalRequests:   1000,
			concurrency:     100,
			rateLimit:       100,
			rateLimitWindow: time.Second,
			emitterDelay:    time.Millisecond,
		},
		{
			name:          "burst_500_concurrent",
			totalRequests: 500,
			concurrency:   200,
			rateLimit:     0,
			emitterDelay:  0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create handler with optional rate limiting
			var handler http.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				mock := &MockEmitter{delay: tt.emitterDelay}
				mock.Push(r.Context(), w, nil)
			})

			if tt.rateLimit > 0 {
				rl := middleware.NewRateLimiterPathOnly(tt.rateLimit, tt.rateLimitWindow)
				handler = rl.MiddlewarePathOnly(handler)
			}

			ts := httptest.NewServer(handler)
			defer ts.Close()

			// Reusable client with connection pooling
			client := &http.Client{
				Transport: &http.Transport{
					MaxIdleConns:        tt.concurrency,
					MaxIdleConnsPerHost: tt.concurrency,
					IdleConnTimeout:     30 * time.Second,
				},
			}

			var (
				wg           sync.WaitGroup
				successCount int64
				rateLimited  int64
				errorCount   int64
				totalLatency int64
			)

			sem := make(chan struct{}, tt.concurrency)
			start := time.Now()

			for i := 0; i < tt.totalRequests; i++ {
				wg.Add(1)
				sem <- struct{}{}

				go func() {
					defer wg.Done()
					defer func() { <-sem }()

					reqStart := time.Now()
					resp, err := client.Get(ts.URL + "/api/v1/users")
					latency := time.Since(reqStart)

					if err != nil {
						atomic.AddInt64(&errorCount, 1)
						return
					}
					defer resp.Body.Close()
					io.ReadAll(resp.Body)

					atomic.AddInt64(&totalLatency, int64(latency))

					switch resp.StatusCode {
					case http.StatusOK:
						atomic.AddInt64(&successCount, 1)
					case http.StatusTooManyRequests:
						atomic.AddInt64(&rateLimited, 1)
					default:
						atomic.AddInt64(&errorCount, 1)
					}
				}()
			}

			wg.Wait()
			elapsed := time.Since(start)

			success := atomic.LoadInt64(&successCount)
			limited := atomic.LoadInt64(&rateLimited)
			errors := atomic.LoadInt64(&errorCount)
			avgLatency := time.Duration(0)
			processed := success + limited
			if processed > 0 {
				avgLatency = time.Duration(atomic.LoadInt64(&totalLatency) / processed)
			}

			t.Logf("Results for %s:", tt.name)
			t.Logf("  Total requests: %d", tt.totalRequests)
			t.Logf("  Successful: %d (%.1f%%)", success, float64(success)/float64(tt.totalRequests)*100)
			t.Logf("  Rate limited: %d (%.1f%%)", limited, float64(limited)/float64(tt.totalRequests)*100)
			t.Logf("  Errors: %d", errors)
			t.Logf("  Total time: %v", elapsed)
			t.Logf("  Avg latency: %v", avgLatency)
			t.Logf("  Throughput: %.1f req/s", float64(tt.totalRequests)/elapsed.Seconds())

			// Validate rate limiting works
			if tt.rateLimit > 0 && limited == 0 && tt.totalRequests > tt.rateLimit {
				t.Errorf("Expected some rate limited requests with limit %d, got none", tt.rateLimit)
			}

			// Allow small error margin for connection issues
			errorRate := float64(errors) / float64(tt.totalRequests)
			if errorRate > 0.05 {
				t.Errorf("Error rate too high: %.1f%% (max 5%%)", errorRate*100)
			}
		})
	}
}

func TestRateLimiterStress(t *testing.T) {
	rl := middleware.NewRateLimiter(100, time.Second)

	handler := rl.MiddlewarePathOnly(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	ts := httptest.NewServer(handler)
	defer ts.Close()

	client := &http.Client{
		Transport: &http.Transport{
			MaxIdleConns:        500,
			MaxIdleConnsPerHost: 500,
		},
	}

	var (
		wg      sync.WaitGroup
		allowed int64
		denied  int64
		errors  int64
	)

	// Fire 500 requests as fast as possible
	for i := 0; i < 500; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			resp, err := client.Get(ts.URL)
			if err != nil {
				atomic.AddInt64(&errors, 1)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode == http.StatusOK {
				atomic.AddInt64(&allowed, 1)
			} else if resp.StatusCode == http.StatusTooManyRequests {
				atomic.AddInt64(&denied, 1)
			}
		}()
	}

	wg.Wait()

	t.Logf("Rate limiter stress test (limit=100/sec, requests=500):")
	t.Logf("  Allowed: %d", allowed)
	t.Logf("  Denied: %d", denied)
	t.Logf("  Connection errors: %d", errors)

	// Rate limiter should work correctly
	if allowed > 150 {
		t.Errorf("Rate limiter allowed too many: %d (expected ~100)", allowed)
	}
	// With connection pooling, most denied should be counted
	totalHandled := allowed + denied
	if totalHandled < 200 {
		t.Logf("Warning: only %d requests reached server (connection issues)", totalHandled)
	}
}

func BenchmarkGetUsersConcurrent(b *testing.B) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`[{"id":"test"}]`))
	})

	ts := httptest.NewServer(handler)
	defer ts.Close()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		client := &http.Client{}
		for pb.Next() {
			resp, err := client.Get(ts.URL)
			if err != nil {
				b.Fatal(err)
			}
			io.ReadAll(resp.Body)
			resp.Body.Close()
		}
	})
}

func BenchmarkRateLimiterAllow(b *testing.B) {
	rl := middleware.NewRateLimiter(10000, time.Second)

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			rl.Allow(fmt.Sprintf("client-%d", i%100))
			i++
		}
	})
}
