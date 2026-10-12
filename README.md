# Run My Errands

A web app for connecting people who need help with everyday errands with people who can run them.

## Project structure

| Folder      | Stack                                            | Runs on |
|-------------|--------------------------------------------------|---------|
| `backend/`  | Spring Boot 4.1, Java 21, PostgreSQL 16, Flyway  | :8080   |
| `frontend/` | React 18, TypeScript, Vite                       | :5173   |

## Requirements

- JDK 21
- Maven 3.9+
- Node.js 20+ and npm
- Docker (for the local PostgreSQL database)

## Getting started

1. **Database:** `cd backend && docker compose up -d`
2. **Backend:** `cd backend && mvn spring-boot:run`
3. **Frontend:** `cd frontend && npm install && npm run dev`, then open http://localhost:5173

In VS Code, open `run-my-errands.code-workspace` to get both projects plus the recommended extensions.
