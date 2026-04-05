# 💰 Financial Management Backend

A role-based financial records management system with dashboard analytics, access control, validation, and data persistence.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [1. User & Role Management](#1-user--role-management)
- [2. Financial Records Management](#2-financial-records-management)
- [3. Dashboard Summary APIs](#3-dashboard-summary-apis)
- [4. Access Control Logic](#4-access-control-logic)
- [5. Validation & Error Handling](#5-validation--error-handling)
- [6. Data Persistence](#6-data-persistence)
- [API Reference](#api-reference)
- [Error Codes](#error-codes)

---

## Overview

This backend system provides:

- **User management** with role-based access control (Viewer, Analyst, Admin)
- **Financial records** CRUD with filtering support
- **Dashboard APIs** returning aggregated summaries and trends
- **Middleware-level access control** enforced on every route
- **Input validation** with descriptive error responses
- **Persistent storage** via SQLite (or swappable with PostgreSQL/MongoDB)

---

## Tech Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | SQLite (via `better-sqlite3`) |
| Auth | JWT (JSON Web Tokens) |
| Validation | Joi / Zod |
| Password Hashing | bcrypt |

> **Note:** SQLite is used for simplicity and portability. The data access layer is abstracted so it can be swapped with PostgreSQL or MongoDB without changing business logic.

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/financial-backend.git
cd financial-backend
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
DB_PATH=./database/finance.db
NODE_ENV=development
```

### Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Seed Default Admin

```bash
npm run seed
# Creates: admin@app.com / Admin@123
```

---

## Project Structure

```
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── record.controller.js
│   │   └── dashboard.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT verification
│   │   ├── role.middleware.js       # Role-based access guard
│   │   └── validate.middleware.js   # Input validation
│   ├── models/
│   │   ├── user.model.js
│   │   └── record.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── record.routes.js
│   │   └── dashboard.routes.js
│   ├── services/
│   │   ├── user.service.js
│   │   ├── record.service.js
│   │   └── dashboard.service.js
│   ├── validators/
│   │   ├── user.validator.js
│   │   └── record.validator.js
│   └── app.js
├── database/
│   └── schema.sql
├── .env
├── package.json
└── README.md
```

---

## 1. User & Role Management

### Roles

| Role | Description |
|---|---|
| `viewer` | Read-only access to dashboard data |
| `analyst` | Can view records and access insights/summaries |
| `admin` | Full access — manage records, users, and settings |

### Endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Admin | Create a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/:id` | Admin | Get a single user |
| PATCH | `/api/users/:id` | Admin | Update user role or status |
| DELETE | `/api/users/:id` | Admin | Delete a user |

### User Schema

```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "hashed",
  "role": "analyst",
  "status": "active",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Managing User Status

- Users can be set to `active` or `inactive`
- Inactive users cannot log in — JWT requests will be rejected at the middleware level

```bash
PATCH /api/users/:id
{
  "status": "inactive"
}
```

---

## 2. Financial Records Management

### Record Schema

```json
{
  "id": "uuid",
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-01",
  "notes": "June salary payment",
  "createdBy": "user-uuid",
  "createdAt": "2024-06-01T09:00:00Z",
  "updatedAt": "2024-06-01T09:00:00Z"
}
```

### Supported Types

- `income` — money coming in
- `expense` — money going out

### Endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/records` | Admin | Create a new record |
| GET | `/api/records` | Analyst, Admin | Get all records (supports filters) |
| GET | `/api/records/:id` | Analyst, Admin | Get a single record |
| PATCH | `/api/records/:id` | Admin | Update a record |
| DELETE | `/api/records/:id` | Admin | Delete a record |

### Filtering

Records support query-based filtering:

```
GET /api/records?type=expense&category=Food&startDate=2024-01-01&endDate=2024-06-30
```

| Query Param | Type | Example |
|---|---|---|
| `type` | string | `income` or `expense` |
| `category` | string | `Food`, `Salary`, `Rent` |
| `startDate` | ISO date | `2024-01-01` |
| `endDate` | ISO date | `2024-06-30` |
| `minAmount` | number | `100` |
| `maxAmount` | number | `5000` |
| `page` | number | `1` |
| `limit` | number | `20` |

---

## 3. Dashboard Summary APIs

All dashboard endpoints require at least `analyst` role.

### Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/api/dashboard/summary` | Total income, expenses, net balance |
| GET | `/api/dashboard/by-category` | Totals grouped by category |
| GET | `/api/dashboard/trends` | Monthly or weekly breakdown |
| GET | `/api/dashboard/recent` | Latest 10 transactions |

### Sample Response — `/api/dashboard/summary`

```json
{
  "totalIncome": 45000.00,
  "totalExpenses": 28500.00,
  "netBalance": 16500.00,
  "recordCount": 142,
  "period": "all-time"
}
```

### Sample Response — `/api/dashboard/by-category`

```json
{
  "categories": [
    { "category": "Salary",    "type": "income",  "total": 40000 },
    { "category": "Freelance", "type": "income",  "total": 5000  },
    { "category": "Rent",      "type": "expense", "total": 12000 },
    { "category": "Food",      "type": "expense", "total": 4500  }
  ]
}
```

### Sample Response — `/api/dashboard/trends`

```json
{
  "interval": "monthly",
  "data": [
    { "period": "2024-01", "income": 7500, "expenses": 4200 },
    { "period": "2024-02", "income": 7500, "expenses": 5100 },
    { "period": "2024-03", "income": 9000, "expenses": 3800 }
  ]
}
```

---

## 4. Access Control Logic

Access control is enforced at the middleware level using two layers:

### Layer 1 — JWT Authentication (`auth.middleware.js`)

Every protected route first verifies the JWT token and checks that the user is `active`.

```js
// Applied to all /api/* routes except /api/auth/login
router.use(authMiddleware);
```

### Layer 2 — Role Guard (`role.middleware.js`)

Routes are protected by role using a `requireRole()` guard:

```js
// Only admins can create records
router.post('/records', requireRole('admin'), recordController.create);

// Analysts and admins can view records
router.get('/records', requireRole('analyst', 'admin'), recordController.getAll);

// Only admins can manage users
router.patch('/users/:id', requireRole('admin'), userController.update);
```

### Role Permission Matrix

| Action | Viewer | Analyst | Admin |
|---|---|---|---|
| View dashboard summary | ✅ | ✅ | ✅ |
| View records | ❌ | ✅ | ✅ |
| View insights / trends | ❌ | ✅ | ✅ |
| Create records | ❌ | ❌ | ✅ |
| Update records | ❌ | ❌ | ✅ |
| Delete records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## 5. Validation & Error Handling

### Input Validation

All incoming request bodies are validated using a schema validator before reaching the controller. Invalid requests are rejected immediately with a `400` response.

**Example — Create Record validation:**

```js
const recordSchema = Joi.object({
  amount:   Joi.number().positive().required(),
  type:     Joi.string().valid('income', 'expense').required(),
  category: Joi.string().min(1).max(100).required(),
  date:     Joi.date().iso().required(),
  notes:    Joi.string().max(500).optional()
});
```

### Error Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "amount must be a positive number",
    "details": [
      { "field": "amount", "issue": "must be a positive number" }
    ]
  }
}
```

### HTTP Status Codes

| Code | When Used |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Validation error / bad request |
| `401` | Missing or invalid JWT |
| `403` | Authenticated but insufficient role |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `500` | Internal server error |

### Global Error Handler

An Express global error handler catches all unhandled errors and formats them consistently, preventing stack traces from leaking to clients in production.

---

## 6. Data Persistence

### Storage: SQLite

SQLite is used for its simplicity and zero-configuration setup. It is suitable for development, testing, and small-to-medium deployments.

> **To switch databases:** Replace the data access layer in `src/models/` with a Sequelize ORM config (PostgreSQL/MySQL) or a Mongoose config (MongoDB). Business logic in services and controllers remains unchanged.

### Schema

```sql
-- Users table
CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT CHECK(role IN ('viewer','analyst','admin')) NOT NULL DEFAULT 'viewer',
  status     TEXT CHECK(status IN ('active','inactive')) NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Financial records table
CREATE TABLE records (
  id         TEXT PRIMARY KEY,
  amount     REAL NOT NULL CHECK(amount > 0),
  type       TEXT CHECK(type IN ('income','expense')) NOT NULL,
  category   TEXT NOT NULL,
  date       TEXT NOT NULL,
  notes      TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common filter queries
CREATE INDEX idx_records_type     ON records(type);
CREATE INDEX idx_records_category ON records(category);
CREATE INDEX idx_records_date     ON records(date);
```

### Persistence Notes

- The database file is created automatically at the path set in `DB_PATH`
- Run `npm run migrate` to apply the schema on first setup
- Run `npm run seed` to insert a default admin user for testing

---

## API Reference

### Base URL

```
http://localhost:3000/api
```

### Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

### Quick Test with curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@app.com","password":"Admin@123"}'

# Create a record (use token from login)
curl -X POST http://localhost:3000/api/records \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount":1500,"type":"income","category":"Salary","date":"2024-06-01"}'

# Get dashboard summary
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer <token>"
```

---

## Error Codes

| Code | Description |
|---|---|
| `VALIDATION_ERROR` | Request body failed schema validation |
| `UNAUTHORIZED` | No token or token is invalid/expired |
| `FORBIDDEN` | Valid token but role lacks permission |
| `NOT_FOUND` | Resource does not exist |
| `DUPLICATE_EMAIL` | Email already registered |
| `INACTIVE_USER` | User account has been deactivated |
| `INTERNAL_ERROR` | Unexpected server error |

---

## License

MIT
