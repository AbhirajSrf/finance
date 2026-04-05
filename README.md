# Finance Backend API

A Node.js + Express + MongoDB REST API for managing financial transactions with role-based access control.

---

## Tech Stack

- **Runtime** — Node.js
- **Framework** — Express.js
- **Database** — MongoDB (Mongoose)
- **Auth** — JWT (via cookies)
- **Password Hashing** — bcryptjs

---

## Roles

| Role      | Access                                                        |
| --------- | ------------------------------------------------------------- |
| `user`    | Dashboard data only                                           |
| `analyst` | View records and insights                                     |
| `admin`   | Full access — create, update, delete records and manage users |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=client_url
```

### 3. Start the server

```bash
npm run start
```

Server runs on `http://localhost:5000`

---

## API Endpoints

### Auth

| Method | Endpoint           | Description           | Access    |
| ------ | ------------------ | --------------------- | --------- |
| POST   | `/api/auth/signup` | Register a new user   | Public    |
| POST   | `/api/auth/login`  | Login                 | Public    |
| POST   | `/api/auth/logout` | Logout                | Logged in |
| GET    | `/api/auth/check`  | Check current session | Logged in |

### Admin — User Management

| Method | Endpoint                      | Description           | Access |
| ------ | ----------------------------- | --------------------- | ------ |
| GET    | `/api/admin/users`            | Get all users         | Admin  |
| POST   | `/api/admin/users`            | Create a user         | Admin  |
| PATCH  | `/api/admin/users/:id/role`   | Assign role           | Admin  |
| PATCH  | `/api/admin/users/:id/status` | Activate / deactivate | Admin  |
| DELETE | `/api/admin/users/:id`        | Delete a user         | Admin  |

### Transactions

| Method | Endpoint                      | Description                  | Access               |
| ------ | ----------------------------- | ---------------------------- | -------------------- |
| GET    | `/api/transactions/dashboard` | Summary overview             | User, Analyst, Admin |
| GET    | `/api/transactions`           | List all with filters        | Analyst, Admin       |
| GET    | `/api/transactions/summary`   | Income, expense, net balance | Analyst, Admin       |
| GET    | `/api/transactions/:id`       | Single transaction           | Analyst, Admin       |
| POST   | `/api/transactions`           | Create transaction           | Admin                |
| PATCH  | `/api/transactions/:id`       | Update transaction           | Admin                |
| DELETE | `/api/transactions/:id`       | Delete transaction           | Admin                |

---

## Transaction Filters

Apply as query params on `GET /api/transactions`:

| Param       | Example                 | Description                     |
| ----------- | ----------------------- | ------------------------------- |
| `type`      | `?type=income`          | Filter by `income` or `expense` |
| `category`  | `?category=Rent`        | Partial, case-insensitive match |
| `startDate` | `?startDate=2024-01-01` | From this date                  |
| `endDate`   | `?endDate=2024-12-31`   | Up to this date                 |

---

## Transaction Fields

| Field      | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| `amount`   | Number | ✅       | Must be positive            |
| `type`     | String | ✅       | `income` or `expense`       |
| `category` | String | ✅       | e.g. Sales, Rent, Utilities |
| `date`     | Date   | ✅       | Defaults to current date    |
| `notes`    | String | ✗        | Optional description        |

---

## Project Structure

```
src/
├── config/
│   ├── db.js
│   ├── env.js
│   └── utils.js
├── controllers/
│   ├── auth.controller.js
│   ├── admin.controller.js
│   └── transaction.controller.js
├── middleware/
│   ├── auth.middleware.js
│   ├── admin.middleware.js
│   └── analyst.middleware.js
├── models/
│   ├── user.model.js
│   └── transaction.model.js
├── routes/
│   ├── auth.route.js
│   ├── admin.route.js
│   └── transaction.route.js
└── server.js
```
