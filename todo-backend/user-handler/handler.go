package user_handler

import (
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"context"
	"net/http"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID       primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email    string             `bson:"email"       json:"email"`
	Password string             `bson:"password"    json:"-"`
	Verified bool               `bson:"verified"    json:"verified" gorm:"default:false"`
}

var jwtKey = []byte("your-secret-key")

type MyClaims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Verified bool   `json:"verified"`
	jwt.RegisteredClaims
}

func GenerateToken(userID string, email string, status bool) (string, error) {
	claims := MyClaims{
		UserID:   userID,
		Email:    email,
		Verified: status,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			Subject:   userID,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func Signup(userColl *mongo.Collection) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required,min=6"`
			Verified bool   `json:"verified" `
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Check for existing user
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := userColl.FindOne(ctx, bson.M{"email": body.Email}).Err(); err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "email already registered"})
			return
		}

		// Hash password
		hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not hash password"})
			return
		}

		// Insert user
		user := User{Email: body.Email, Password: string(hash), Verified: body.Verified}
		_, err = userColl.InsertOne(ctx, user)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create user"})
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message": "user created"})
	}
}

func Login(userColl *mongo.Collection) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body struct {
			Email    string `json:"email" binding:"required,email"`
			Password string `json:"password" binding:"required"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Find user
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		var user User
		err := userColl.FindOne(ctx, bson.M{"email": body.Email}).Decode(&user)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		// Compare password
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
			return
		}

		// Generate JWT
		token, err := GenerateToken(user.ID.Hex(), user.Email, user.Verified)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not generate token"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"token": token})
	}
}

func VerifyUser(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1) Bind & validate the JSON payload
		var body struct {
			Email string `json:"email" binding:"required,email"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email payload"})
			return
		}

		// 2) Update the verified flag in the DB
		result := db.Model(&User{}).
			Where("email = ?", body.Email).
			Update("verified", true)

		if result.Error != nil {
			log.Printf("DB error on verify (%s): %v", body.Email, result.Error)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "could not update user"})
			return
		}
		if result.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}

		// 3) Success response
		c.JSON(http.StatusOK, gin.H{"status": "verified"})
	}
}
