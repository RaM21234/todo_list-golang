package otp_verification

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

// ─── In‑Memory OTP Store ───────

var (
	otpStore = make(map[string]string) // email → code
	mu       = sync.Mutex{}
)

// generate a 6‑digit code
func newOTP() string {
	return fmt.Sprintf("%06d", rand.Intn(1_000_000))
}

// issueOTP creates an OTP for email, valid for ttl duration
func IssueOTP(email string, ttl time.Duration) string {
	code := newOTP()
	mu.Lock()
	otpStore[email] = code
	mu.Unlock()

	// expire it after ttl
	go func() {
		time.Sleep(ttl)
		mu.Lock()
		delete(otpStore, email)
		mu.Unlock()
	}()
	return code
}

// verifyOTP checks & consumes the code for that email
func VerifyOTP(email, code string) bool {
	mu.Lock()
	defer mu.Unlock()
	if otpStore[email] == code {
		delete(otpStore, email)
		return true
	}
	return false
}
