package consumer

import (
	"log"
	"sync"
	"time"

	"github.com/Flaviogonzalez/e-commerce/contracts"
)

// Alerter handles real-time alerting for critical log entries
type Alerter struct {
	mu          sync.RWMutex
	errorCounts map[string]*errorCounter
	thresholds  map[contracts.LogLevel]AlertThreshold
}

type errorCounter struct {
	count     int
	windowEnd time.Time
}

type AlertThreshold struct {
	Count      int
	WindowSecs int
}

func NewAlerter() *Alerter {
	return &Alerter{
		errorCounts: make(map[string]*errorCounter),
		thresholds: map[contracts.LogLevel]AlertThreshold{
			contracts.LogError: {Count: 10, WindowSecs: 60}, // 10 errors in 1 min
			contracts.LogFatal: {Count: 1, WindowSecs: 60},  // Any fatal is alert
		},
	}
}

func (a *Alerter) Check(entry contracts.LogEntry) {
	switch entry.Level {
	case contracts.LogFatal:
		a.triggerAlert(entry, "FATAL log detected")
	case contracts.LogError:
		if a.checkThreshold(entry.Service, entry.Level) {
			a.triggerAlert(entry, "Error threshold exceeded")
		}
	}
}

func (a *Alerter) checkThreshold(service string, level contracts.LogLevel) bool {
	threshold, ok := a.thresholds[level]
	if !ok {
		return false
	}

	key := service + ":" + string(level)
	now := time.Now()

	a.mu.Lock()
	defer a.mu.Unlock()

	counter, exists := a.errorCounts[key]
	if !exists || now.After(counter.windowEnd) {
		a.errorCounts[key] = &errorCounter{
			count:     1,
			windowEnd: now.Add(time.Duration(threshold.WindowSecs) * time.Second),
		}
		return false
	}

	counter.count++
	return counter.count >= threshold.Count
}

func (a *Alerter) triggerAlert(entry contracts.LogEntry, reason string) {
	// Production: send to PagerDuty, Slack, email, etc.
	log.Printf("🚨 ALERT [%s] Service: %s, Level: %s, Message: %s, Error: %s",
		reason,
		entry.Service,
		entry.Level,
		entry.Message,
		entry.Error,
	)

	// Could emit to a separate Kafka topic for alert processing
	// Could call webhook
	// Could send to Redis pub/sub for real-time dashboards
}

// SetThreshold allows runtime configuration of alert thresholds
func (a *Alerter) SetThreshold(level contracts.LogLevel, count, windowSecs int) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.thresholds[level] = AlertThreshold{Count: count, WindowSecs: windowSecs}
}
