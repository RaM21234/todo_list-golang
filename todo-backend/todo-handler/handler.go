package todohandler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"go.mongodb.org/mongo-driver/mongo"
)

type Todo struct {
	User        string             `json:"user"`
	Id          primitive.ObjectID `json:"id" bson:"_id"`
	Date        string             `json:"date"`
	Tag         string             `json:"tag"`
	Description string             `json:"description"`
}

// Handler: fetch and return all todos
func GetAllTodos(c *gin.Context, todoColl *mongo.Collection) {
	// create a fresh context for this operation
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// find all documents
	cursor, err := todoColl.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query todos"})
		return
	}
	defer cursor.Close(ctx)

	// decode into a slice
	var todos []Todo
	if err := cursor.All(ctx, &todos); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode todos"})
		return
	}

	// return JSON array of todos
	c.JSON(http.StatusOK, todos)
}

// getTodosByUser returns only those todos whose Todo.User matches the :user param.
func GetTodosByUser(c *gin.Context, todoColl *mongo.Collection) {
	user := c.Param("user")
	if user == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user parameter required"})
		return
	}

	// create a fresh context
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// filter on the "user" field
	filter := bson.M{"user": user}
	cursor, err := todoColl.Find(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to query todos"})
		return
	}
	defer cursor.Close(ctx)

	var todos []Todo
	if err := cursor.All(ctx, &todos); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode todos"})
		return
	}

	c.JSON(http.StatusOK, todos)
}

// Handler: create and insert a new Todo
func CreateTodo(c *gin.Context, todoColl *mongo.Collection) {
	var body struct {
		User        string `json:"user"        binding:"required"`
		Tag         string `json:"tag"         binding:"required"`
		Description string `json:"description" binding:"required"`
	}

	// bind and validate JSON body
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// assemble new Todo
	now := time.Now().Format(time.RFC3339)
	newTodo := Todo{
		User:        body.User,
		Id:          primitive.NewObjectID(),
		Date:        now,
		Tag:         body.Tag,
		Description: body.Description,
	}

	// insert into Mongo
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	res, err := todoColl.InsertOne(ctx, newTodo)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	c.JSON(201, res)
}

// updateTodo handles PUT /todos/:id
func UpdateTodo(c *gin.Context, todoColl *mongo.Collection) {
	// 1) Parse the :id param
	idParam := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id format"})
		return
	}

	// 2) Bind incoming JSON. Only allow the fields you want to update:
	var body struct {
		User        *string `json:"user"`
		Date        *string `json:"date"`
		Tag         *string `json:"tag"`
		Description *string `json:"description"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3) Build the $set document from non-nil fields
	update := bson.M{}
	if body.User != nil {
		update["user"] = *body.User
	}
	if body.Date != nil {
		update["date"] = *body.Date
	}
	if body.Tag != nil {
		update["tag"] = *body.Tag
	}
	if body.Description != nil {
		update["description"] = *body.Description
	}

	if len(update) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	// 4) Perform the update
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	res, err := todoColl.UpdateOne(
		ctx,
		bson.M{"_id": oid},
		bson.M{"$set": update},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if res.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "todo not found"})
		return
	}

	// 5) Return success (you could fetch and return the updated doc if you like)
	c.JSON(http.StatusOK, gin.H{
		"updatedId":     idParam,
		"modifiedCount": res.ModifiedCount,
	})
}

// delete todo
func DeleteTodo(c *gin.Context, todoColl *mongo.Collection) {
	// 1) Parse the :id parameter into an ObjectID
	idParam := c.Param("id")
	oid, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id format"})
		return
	}

	// 2) Create a short‑lived context
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 3) Perform the deletion
	res, err := todoColl.DeleteOne(ctx, bson.M{"_id": oid})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error: " + err.Error()})
		return
	}
	if res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "todo not found"})
		return
	}

	// 4) Return success
	c.JSON(http.StatusOK, gin.H{"deletedId": idParam})
}
