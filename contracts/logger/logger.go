package logger

import (
	"context"
	"encoding/json"
	"fmt"
	"runtime"
	"sync"
	"time"

	"github.com/Flaviogonzalez/e-commerce/contracts"
	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
)

type Logger struct {
	service  string
	writer   *kafka.Writer
	minLevel contracts.LogLevel
	buffer   chan contracts.LogEntry
	wg       sync.WaitGroup
	ctx      context.Context
	cancel   context.CancelFunc
}

type Config struct {
	Service      string
	KafkaBrokers []string
	Topic        string
	MinLevel     contracts.LogLevel
	BufferSize   int
	BatchSize    int
}

var levelPriority = map[contracts.LogLevel]int{
	contracts.LogDebug: 0,
	contracts.LogInfo:  1,
	contracts.LogWarn:  2,
	contracts.LogError: 3,
	contracts.LogFatal: 4,
}

func New(cfg Config) (*Logger, error) {
	if cfg.BufferSize == 0 {
		cfg.BufferSize = 1000
	}
	if cfg.BatchSize == 0 {
		cfg.BatchSize = 100
	}
	if cfg.Topic == "" {
		cfg.Topic = "logs"
	}
	if cfg.MinLevel == "" {
		cfg.MinLevel = contracts.LogInfo
	}

	writer := &kafka.Writer{
		Addr:                   kafka.TCP(cfg.KafkaBrokers...),
		Topic:                  cfg.Topic,
		Balancer:               &kafka.LeastBytes{},
		BatchSize:              cfg.BatchSize,
		BatchTimeout:           50 * time.Millisecond,
		AllowAutoTopicCreation: true,
		Async:                  true, // Non-blocking writes
	}

	ctx, cancel := context.WithCancel(context.Background())

	l := &Logger{
		service:  cfg.Service,
		writer:   writer,
		minLevel: cfg.MinLevel,
		buffer:   make(chan contracts.LogEntry, cfg.BufferSize),
		ctx:      ctx,
		cancel:   cancel,
	}

	// Start background worker
	l.wg.Add(1)
	go l.worker()

	return l, nil
}

func (l *Logger) worker() {
	defer l.wg.Done()

	for {
		select {
		case entry := <-l.buffer:
			l.send(entry)
		case <-l.ctx.Done():
			// Drain remaining logs
			for {
				select {
				case entry := <-l.buffer:
					l.send(entry)
				default:
					return
				}
			}
		}
	}
}

func (l *Logger) send(entry contracts.LogEntry) {
	data, err := json.Marshal(entry)
	if err != nil {
		return
	}

	_ = l.writer.WriteMessages(l.ctx, kafka.Message{
		Key:   []byte(entry.Service),
		Value: data,
	})
}

func (l *Logger) shouldLog(level contracts.LogLevel) bool {
	return levelPriority[level] >= levelPriority[l.minLevel]
}

func (l *Logger) log(level contracts.LogLevel, msg string, opts ...Option) {
	if !l.shouldLog(level) {
		return
	}

	entry := contracts.LogEntry{
		ID:        uuid.New().String(),
		Timestamp: time.Now().UTC(),
		Level:     level,
		Service:   l.service,
		Message:   msg,
	}

	for _, opt := range opts {
		opt(&entry)
	}

	select {
	case l.buffer <- entry:
	default:
		// Buffer full, drop log (could emit metric here)
	}
}

func (l *Logger) Debug(msg string, opts ...Option) {
	l.log(contracts.LogDebug, msg, opts...)
}

func (l *Logger) Info(msg string, opts ...Option) {
	l.log(contracts.LogInfo, msg, opts...)
}

func (l *Logger) Warn(msg string, opts ...Option) {
	l.log(contracts.LogWarn, msg, opts...)
}

func (l *Logger) Error(msg string, opts ...Option) {
	l.log(contracts.LogError, msg, opts...)
}

func (l *Logger) Fatal(msg string, opts ...Option) {
	l.log(contracts.LogFatal, msg, opts...)
}

func (l *Logger) Close() error {
	l.cancel()
	l.wg.Wait()
	return l.writer.Close()
}

// Option functions for structured logging
type Option func(*contracts.LogEntry)

func WithError(err error) Option {
	return func(e *contracts.LogEntry) {
		if err != nil {
			e.Error = err.Error()
		}
	}
}

func WithStack() Option {
	return func(e *contracts.LogEntry) {
		buf := make([]byte, 4096)
		n := runtime.Stack(buf, false)
		e.StackTrace = string(buf[:n])
	}
}

func WithData(data map[string]interface{}) Option {
	return func(e *contracts.LogEntry) {
		e.Data = data
	}
}

func WithField(key string, value interface{}) Option {
	return func(e *contracts.LogEntry) {
		if e.Data == nil {
			e.Data = make(map[string]interface{})
		}
		e.Data[key] = value
	}
}

func WithTraceID(traceID string) Option {
	return func(e *contracts.LogEntry) {
		e.TraceID = traceID
	}
}

func WithSpanID(spanID string) Option {
	return func(e *contracts.LogEntry) {
		e.SpanID = spanID
	}
}

func WithHTTP(method, path string, status int, duration time.Duration) Option {
	return func(e *contracts.LogEntry) {
		e.HTTPMethod = method
		e.HTTPPath = path
		e.HTTPStatus = status
		e.Duration = duration.Milliseconds()
	}
}

func WithUser(userID, ip, userAgent string) Option {
	return func(e *contracts.LogEntry) {
		e.UserID = userID
		e.IP = ip
		e.UserAgent = userAgent
	}
}

func WithDuration(d time.Duration) Option {
	return func(e *contracts.LogEntry) {
		e.Duration = d.Milliseconds()
	}
}

// Helper for request logging
func (l *Logger) LogRequest(method, path string, status int, duration time.Duration, opts ...Option) {
	level := contracts.LogInfo
	if status >= 500 {
		level = contracts.LogError
	} else if status >= 400 {
		level = contracts.LogWarn
	}

	allOpts := append([]Option{WithHTTP(method, path, status, duration)}, opts...)
	l.log(level, fmt.Sprintf("%s %s %d", method, path, status), allOpts...)
}
