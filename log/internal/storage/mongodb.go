package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/Flaviogonzalez/e-commerce/contracts"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	client     *mongo.Client
	db         *mongo.Database
	collection *mongo.Collection
}

func NewMongoDB(ctx context.Context, uri, dbName string) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}

	if err := client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}

	db := client.Database(dbName)
	collection := db.Collection("entries")

	// Create indexes for efficient querying
	indexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "timestamp", Value: -1}},
			Options: options.Index().SetExpireAfterSeconds(30 * 24 * 60 * 60), // 30 days TTL
		},
		{
			Keys: bson.D{{Key: "level", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "service", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "trace_id", Value: 1}},
		},
		{
			Keys: bson.D{
				{Key: "service", Value: 1},
				{Key: "level", Value: 1},
				{Key: "timestamp", Value: -1},
			},
		},
	}

	_, err = collection.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		return nil, fmt.Errorf("create indexes: %w", err)
	}

	return &MongoDB{
		client:     client,
		db:         db,
		collection: collection,
	}, nil
}

func (m *MongoDB) InsertOne(ctx context.Context, entry contracts.LogEntry) error {
	_, err := m.collection.InsertOne(ctx, entry)
	return err
}

func (m *MongoDB) InsertMany(ctx context.Context, entries []contracts.LogEntry) error {
	if len(entries) == 0 {
		return nil
	}

	docs := make([]interface{}, len(entries))
	for i, e := range entries {
		docs[i] = e
	}

	_, err := m.collection.InsertMany(ctx, docs)
	return err
}

func (m *MongoDB) Query(ctx context.Context, filter QueryFilter, limit int64) ([]contracts.LogEntry, error) {
	opts := options.Find().
		SetSort(bson.D{{Key: "timestamp", Value: -1}}).
		SetLimit(limit)

	bsonFilter := bson.M{}
	if filter.Service != "" {
		bsonFilter["service"] = filter.Service
	}
	if filter.Level != "" {
		bsonFilter["level"] = filter.Level
	}
	if filter.TraceID != "" {
		bsonFilter["trace_id"] = filter.TraceID
	}
	if !filter.From.IsZero() || !filter.To.IsZero() {
		timeFilter := bson.M{}
		if !filter.From.IsZero() {
			timeFilter["$gte"] = filter.From
		}
		if !filter.To.IsZero() {
			timeFilter["$lte"] = filter.To
		}
		bsonFilter["timestamp"] = timeFilter
	}

	cursor, err := m.collection.Find(ctx, bsonFilter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var entries []contracts.LogEntry
	if err := cursor.All(ctx, &entries); err != nil {
		return nil, err
	}

	return entries, nil
}

func (m *MongoDB) CountByLevel(ctx context.Context, service string, since time.Time) (map[contracts.LogLevel]int64, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"service":   service,
			"timestamp": bson.M{"$gte": since},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$level",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := m.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	result := make(map[contracts.LogLevel]int64)
	for cursor.Next(ctx) {
		var doc struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}
		if err := cursor.Decode(&doc); err != nil {
			continue
		}
		result[contracts.LogLevel(doc.ID)] = doc.Count
	}

	return result, nil
}

func (m *MongoDB) Close(ctx context.Context) error {
	return m.client.Disconnect(ctx)
}

type QueryFilter struct {
	Service string
	Level   contracts.LogLevel
	TraceID string
	From    time.Time
	To      time.Time
}
