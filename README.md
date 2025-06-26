# 📝 Todo List App

A full-stack Todo List application built with a Go (Gin & MongoDB) backend and a React (Vite & Tailwind CSS) frontend.  
You can **create**, **read**, **update**, and **delete** todos via a REST API, and manage everything through a clean React UI.

---

## 🚀 Features

- **CRUD** operations on todos  
- **User authentication** with JWT  
- **CORS**-enabled Go API  
- **Tailwind CSS** styling in React  
- Single-click **Add** / **Edit** modal dialogs  


---

## 🛠 Tech Stack

- **Backend**:  
  - [Go](https://golang.org/)  
  - [Gin Gonic](https://github.com/gin-gonic/gin)  
  - [MongoDB](https://www.mongodb.com/) (Atlas)  
  - JWT for auth, bcrypt for password hashing  
- **Frontend**:  
  - [React](https://reactjs.org/)  
  - [Tailwind CSS](https://tailwindcss.com/)  
  - React Router for navigation  

---


## ⚙️ Setup & Run Locally

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/todo-app.git
cd todo-app
```
### 2. Install the project

```bash
cd todo-backend
go mod download
go run main.go
cd todo-frontend
npm install
npm run dev
```
