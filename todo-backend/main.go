package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	mongodb "todo/mongo-db"
	otp_verification "todo/otp-verification"
	todohandler "todo/todo-handler"
	user_handler "todo/user-handler"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	gomail "gopkg.in/gomail.v2"
)

var (
	todoColl *mongo.Collection
	userColl *mongo.Collection
)

type SMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
}

func sendEmail(cfg SMTPConfig, to, subject, body string) error {
	mail := gomail.NewMessage()
	mail.SetHeader("From", cfg.From)
	mail.SetHeader("To", to)
	mail.SetHeader("Subject", subject)
	mail.SetBody("text/plain", body)

	dialer := gomail.NewDialer(cfg.Host, cfg.Port, cfg.Username, cfg.Password)
	return dialer.DialAndSend(mail)
}

func main() {

	// 1) load env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file, reading environment variables directly")
	}

	// db setup
	client, ctx, cancel := mongodb.SetupMongoDB()
	defer cancel()
	defer client.Disconnect(ctx)

	userColl := client.Database("todo").Collection("users")
	todoColl = client.Database("todo").Collection("todos")

	smtpCfg := SMTPConfig{
		Host:     os.Getenv("MAIL_HOST"),
		Port:     587,
		Username: os.Getenv("MAIL_ID"),
		Password: os.Getenv("MAIL_PASSWORD"),
		From:     os.Getenv("MAIL_ID"),
	}

	// gin router
	router := gin.Default()

	// cors middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:3000"}, // frontend origin
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.POST("/request-verify", func(c *gin.Context) {
		var req struct {
			Email string `json:"email"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Email == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
			return
		}

		// issue & store OTP
		otp := otp_verification.IssueOTP(req.Email, 5*time.Minute)

		// send it asynchronously
		go func() {
			body := fmt.Sprintf("Your verification code is: %s\nIt expires in 5 minutes.", otp)
			if err := sendEmail(smtpCfg, req.Email, "Your Verification Code", body); err != nil {
				log.Printf("failed to send email to %s: %v", req.Email, err)
			}
		}()

		c.JSON(http.StatusAccepted, gin.H{"status": "code_sent"})
	})

	router.POST("/verify-code", func(c *gin.Context) {
		var req struct {
			Email string `json:"email"`
			Code  string `json:"code"`
		}
		if err := c.ShouldBindJSON(&req); err != nil || req.Email == "" || req.Code == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
			return
		}

		if otp_verification.VerifyOTP(req.Email, req.Code) {
			c.JSON(http.StatusOK, gin.H{"verified": true})
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired code"})
		}
	})

	router.POST("/verify-user", func(c *gin.Context) {
		// 1) Parse payload
		var req struct {
			Email string `json:"email" binding:"required,email"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email payload"})
			return
		}

		// 2) Build a 5-second context for the update
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// 3) Perform the update
		filter := bson.M{"email": req.Email}
		update := bson.M{"$set": bson.M{"verified": true}}
		result, err := userColl.UpdateOne(ctx, filter, update)
		if err != nil {
			log.Printf("DB error verifying user %s: %v", req.Email, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update user"})
			return
		}
		if result.MatchedCount == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}

		// 4) Success
		c.JSON(http.StatusOK, gin.H{"status": "verified"})
	})

	router.POST("/signup", user_handler.Signup(userColl))
	router.POST("/login", user_handler.Login(userColl))

	// create todo
	router.POST("/todos", func(c *gin.Context) {
		todohandler.CreateTodo(c, todoColl)
	})
	// get all todo
	router.GET("/todos", func(c *gin.Context) {
		todohandler.GetAllTodos(c, todoColl)
	})
	// get by user
	router.GET("/todos/:user", func(c *gin.Context) {
		todohandler.GetTodosByUser(c, todoColl)
	})
	// update one on id
	router.PUT("/todos/:id", func(c *gin.Context) {
		todohandler.UpdateTodo(c, todoColl)
	})
	// delete one on id
	router.DELETE("/todos/:id", func(c *gin.Context) {
		todohandler.DeleteTodo(c, todoColl)
	})

	// start server
	router.Run("localhost:8000")

}
