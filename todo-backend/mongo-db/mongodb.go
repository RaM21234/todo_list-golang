package mongodb

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func SetupMongoDB() (*mongo.Client, context.Context, context.CancelFunc) {
	// 1) load env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file, reading environment variables directly")
	}

	// 2) connect to Mongo
	uri := os.Getenv("DB_STRING")
	if uri == "" {
		log.Fatal("MONGO_URI must be set in .env or environment")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	clientOpts := options.Client().ApplyURI(uri)
	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Fatalf("mongo.Connect error: %v", err)
	}
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatalf("mongo.Ping error: %v", err)
	}

	return client, ctx, cancel
}
