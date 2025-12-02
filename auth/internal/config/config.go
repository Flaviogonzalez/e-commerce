package config

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/flaviogonzalez/e-commerce/auth/internal/routes"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type Config struct {
	db     *sql.DB
	routes http.Handler
}

func InitConfig() *Config {
	db := connectDatabase()
	return &Config{
		db:     db,
		routes: routes.Routes(db),
	}
}

func connectDatabase() *sql.DB {
	db, err := sql.Open("pgx", os.Getenv("DATABASE_URL"))
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	var count int
	for {
		err = db.Ping()
		if err == nil {
			break
		}

		count++
		if count >= 10 {
			log.Fatalf("failed to ping database after 10 attempts: %v", err)
		}
	}

	return db
}

func (c *Config) InitServer() {
	server := &http.Server{
		Addr:    ":8080",
		Handler: c.routes,
	}
	if err := server.ListenAndServe(); err != nil {
		log.Fatalf("server failed: %v", err)
	}
}
