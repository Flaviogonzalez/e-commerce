package repository

import (
	"database/sql"

	"github.com/flaviogonzalez/e-commerce/auth/models"
)

type Repository struct {
	*models.Queries
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{
		Queries: models.New(db),
	}
}
