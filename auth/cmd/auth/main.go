package main

import "github.com/flaviogonzalez/e-commerce/auth/internal/config"

func main() {
	config.InitConfig().InitServer()
}
