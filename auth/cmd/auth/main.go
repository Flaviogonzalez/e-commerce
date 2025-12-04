package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/flaviogonzalez/e-commerce/auth/internal/server"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	db, err := connectToDB()
	if err != nil {
		log.Fatal("Cannot connect to database:", err)
	}
	defer db.Close()
	server := server.NewServer(db)
	HTTPServer := &http.Server{
		Addr:    ":8080",
		Handler: server.Routes(),
	}
	log.Println("Auth service started on port 8080")
	log.Fatal(HTTPServer.ListenAndServe())
}

func connectToDB() (*sql.DB, error) {
	db, err := sql.Open("pgx", os.Getenv("DATABASE_URL"))
	if err != nil {
		return nil, err
	}

	var count int16
	for {
		err = db.Ping()
		if err == nil {
			break
		}

		count++
		if count > 10 {
			return nil, fmt.Errorf("unable to connect to database, exceeded maximum retries")
		}

		log.Println("Waiting for database to be ready...")
		time.Sleep(2 * time.Second)
	}

	return db, nil
}
