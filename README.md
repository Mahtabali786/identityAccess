# Identity & Access Control API

A learning-focused backend using **Node.js + Express + TypeScript + PostgreSQL + Prisma**. It demonstrates the distinction between authentication (who are you?) and authorization (what are you allowed to do?).

## Included

- Registration and login with bcrypt password hashing
- Short-lived signed JWT access tokens
- Refresh tokens stored as SHA-256 hashes in PostgreSQL, with expiry, revocation and rotation
- Authentication middleware that validates a bearer token and checks the current account status/role in the database
- Role-based authorization (`USER`, `ADMIN`)
- Protected profile read/update and password change
- Admin-only user listing and account disable/enable
- Zod request validation, centralized error handling, Helmet, CORS and body size limit
- Prisma models for users, refresh sessions and audit events
- Audit records for important security actions
- Graceful server shutdown and health endpoint

> Educational starter, not a security certification. Before production, add rate limiting, email verification, password reset, monitoring, automated tests, threat modelling and a reviewed deployment configuration. For browser apps, consider storing refresh tokens in `HttpOnly`, `Secure`, `SameSite` cookies with CSRF protections instead of local storage. This sample returns tokens in JSON to keep the HTTP flow easy to inspect.

## Requirements

- Node.js 20+ (Node 22 LTS recommended)
- PostgreSQL 14+
- npm

## 1. Install and configure

```bash
npm install
```

Copy `.env.example` to `.env` and edit `DATABASE_URL` with your PostgreSQL username/password. Replace both JWT secrets with different random secrets (at least 32 characters).

Create a database named `identity_access_db` in PostgreSQL. For example, using `psql`:

```sql
CREATE DATABASE identity_access_db;
```

## 2. Create database tables

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init_identity_access
```

The migration command creates the tables in PostgreSQL from `prisma/schema.prisma`.

## 3. Run the API

```bash
npm run dev
```

API base URL: `http://localhost:4000`

Health check: `GET http://localhost:4000/health`

## Request examples

Use Postman, Bruno, or curl. JSON body examples are shown below. Save the `accessToken` and `refreshToken` from registration/login responses for the next requests.

### Register

`POST /api/auth/register`

```json
{
  "name": "Ayesha Khan",
  "email": "ayesha@example.com",
  "password": "A-strong-password-123"
}
```

### Login

`POST /api/auth/login`

```json
{
  "email": "ayesha@example.com",
  "password": "A-strong-password-123"
}
```

Response shape:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "name": "Ayesha Khan",
      "email": "ayesha@example.com",
      "role": "USER",
      "status": "ACTIVE",
      "createdAt": "..."
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Read own profile (protected)

`GET /api/users/me`

Header: `Authorization: Bearer ACCESS_TOKEN`

### Update own profile (protected)

`PATCH /api/users/me`

Header: `Authorization: Bearer ACCESS_TOKEN`

```json
{ "name": "Ayesha K." }
```

### Change password (protected)

`PATCH /api/users/me/password`

```json
{
  "currentPassword": "A-strong-password-123",
  "newPassword": "Another-strong-password-456"
}
```

This revokes all refresh sessions; log in again after changing the password.

### Refresh access token

`POST /api/auth/refresh`

```json
{ "refreshToken": "REFRESH_TOKEN" }
```

Use the new access and refresh tokens returned. Refresh token rotation means the old token must not be reused.

### Logout

`POST /api/auth/logout`

```json
{ "refreshToken": "REFRESH_TOKEN" }
```

### Admin-only: list users

`GET /api/users/`

Header: `Authorization: Bearer ADMIN_ACCESS_TOKEN`

### Admin-only: disable or enable a user

`PATCH /api/users/USER_UUID/status`

Header: `Authorization: Bearer ADMIN_ACCESS_TOKEN`

```json
{ "status": "DISABLED" }
```

New requests from disabled accounts fail authentication, and their refresh sessions are revoked.

## How to create the first admin

Registration intentionally never accepts a role from the client, preventing users from making themselves admins. After registering your own account, promote it directly in PostgreSQL during local development:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'ayesha@example.com';
```

Log in again to obtain a token, then call the admin endpoints. Never expose a public endpoint that allows arbitrary role changes.

## Architecture

```text
HTTP request
  -> Express route
  -> Zod validation (for request bodies)
  -> Authentication middleware (protected routes)
  -> Authorization middleware (admin-only routes)
  -> Controller (HTTP request/response)
  -> Service (business rules)
  -> Repository (database operations)
  -> Prisma Client
  -> PostgreSQL
```

Auth endpoints follow `routes -> validation -> controller -> service -> repository -> Prisma -> PostgreSQL`. Protected user routes add authentication and, where required, authorization before the controller.

## Authentication vs authorization

- **Authentication:** validates who the caller is. Example: verify the access token and confirm the account is active.
- **Authorization:** checks what the authenticated caller may do. Example: only `ADMIN` may list all users.
- **Credentials:** email and password supplied at login. The password is compared with a bcrypt hash; the raw password is never stored.
- **Identity:** the user account represented by the database `User` row.
- **Permission:** a specific allowed action. This starter uses roles as a simple RBAC example; a larger application can introduce permission tables.

## Main endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Verify credentials and issue tokens |
| POST | `/api/auth/refresh` | Refresh token | Rotate refresh session |
| POST | `/api/auth/logout` | Public, refresh token optional | Revoke refresh session |
| GET | `/api/users/me` | Authenticated | Read own profile |
| PATCH | `/api/users/me` | Authenticated | Update own name |
| PATCH | `/api/users/me/password` | Authenticated | Change password |
| GET | `/api/users/` | Admin | List up to 100 users |
| PATCH | `/api/users/:id/status` | Admin | Disable or enable account |

## Important learning notes

1. Prisma is used inside the repository classes. For example, `prisma.user.create(...)` inserts a user row and `prisma.refreshSession.create(...)` stores a hash of the refresh token in PostgreSQL.
2. Controllers should translate HTTP input into service calls and format the response; they should not contain database queries.
3. Services implement rules such as password checking, account status checks, token issuance and revocation.
4. Repositories group database reads/writes.
5. Middleware runs before controller handlers and can reject the request early.
6. The JWT access token includes a role claim, but authorization uses the role loaded from PostgreSQL, so changing a user's role takes effect on the next request.
7. Refresh-token rotation is a learning implementation. For high-assurance production use, make rotation and reuse detection atomic with a transaction and test concurrency/race conditions.
8. Do not commit `.env` or real tokens/passwords to Git.
