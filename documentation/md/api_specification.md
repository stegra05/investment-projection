# API Specification (Summary)

This document outlines the key API endpoints for the Investment Planning Projection website, facilitating communication between the React frontend and the Flask backend.

**Base Path:** `/api/v1/` (Example base path)
**Authentication:** Most endpoints (excluding registration/login) will require authentication (e.g., via JWT token in Authorization header or session cookie). Unauthenticated requests to protected endpoints should return a `401 Unauthorized` status.

---

## Authentication Endpoints

**1. Register User**
* **Method:** `POST`
* **Path:** `/auth/register`
* **Description:** Creates a new user account.
* **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "username": "newuser", // Optional, if usernames are supported
      "password": "securePassword123"
    }
    ```
* **Success Response:** `201 Created`
    ```json
    {
      "message": "User registered successfully."
      // Or potentially return user object (without password) or user ID
      // "user_id": 123
    }
    ```
* **Error Responses:** `400 Bad Request` (Invalid input, missing fields, weak password), `409 Conflict` (Email or username already exists)

**2. Login User**
* **Method:** `POST`
* **Path:** `/auth/login`
* **Description:** Authenticates a user using email or username and returns access and refresh tokens.
* **Request Body:**
    ```json
    {
      "identifier": "user@example.com", // Can be email or username
      "password": "securePassword123"
    }
    ```
* **Success Response:** `200 OK`
    ```json
    {
      "message": "Login successful.",
      "access_token": "your_jwt_access_token_here",
      "refresh_token": "your_jwt_refresh_token_here"
      // Optionally return user info
    }
    ```
* **Error Responses:** `400 Bad Request` (Missing fields), `401 Unauthorized` (Invalid credentials)

**3. Refresh Token**
* **Method:** `POST`
* **Path:** `/auth/refresh`
* **Description:** Obtains a new access token using a valid refresh token. Requires Authentication via Refresh Token.
* **Request Body:**
    ```json
    {
      "refresh_token": "your_valid_refresh_token"
    }
    ```
* **Success Response:** `200 OK`
    ```json
    {
      "access_token": "new_jwt_access_token_here"
    }
    ```
* **Error Responses:** `401 Unauthorized` (Invalid or expired refresh token)

**4. Logout User**
* **Method:** `POST`
* **Path:** `/auth/logout`
* **Description:** Invalidates the user's refresh token (access tokens are typically short-lived and stateless). Requires Authentication via Access Token.
* **Request Body:** None
* **Success Response:** `200 OK`
    ```json
    {
      "message": "Logout successful."
    }
    ```
* **Error Responses:** `401 Unauthorized`

*(Password Reset endpoints would also be defined here, likely involving token generation and email)*

---

## Portfolio Endpoints

**1. Get User's Portfolios**
* **Method:** `GET`
* **Path:** `/portfolios`
* **Description:** Retrieves a list of portfolios belonging to the authenticated user. Requires Authentication.
* **Request Body:** None
* **Success Response:** `200 OK`
    ```json
    [
      { "portfolio_id": 1, "name": "Retirement Plan", ... },
      { "portfolio_id": 2, "name": "House Fund", ... }
    ]
    ```
* **Error Responses:** `401 Unauthorized`

**2. Create Portfolio**
* **Method:** `POST`
* **Path:** `/portfolios`
* **Description:** Creates a new portfolio for the authenticated user. Requires Authentication.
* **Request Body:**
    ```json
    {
      "name": "New Investment Portfolio",
      "description": "Optional description..."
    }
    ```
* **Success Response:** `201 Created`
    ```json
    {
      "portfolio_id": 3,
      "name": "New Investment Portfolio",
      ... // Other portfolio details
    }
    ```
* **Error Responses:** `400 Bad Request`, `401 Unauthorized`

**3. Get Portfolio Details**
* **Method:** `GET`
* **Path:** `/portfolios/{portfolio_id}`
* **Description:** Retrieves details for a specific portfolio, including its assets and planned changes. Requires Authentication and authorization (user must own the portfolio).
* **Request Body:** None
* **Success Response:** `200 OK`
    ```json
    {
      "portfolio_id": 1,
      "name": "Retirement Plan",
      "assets": [ ... ], // Array of asset objects
      "planned_changes": [ ... ] // Array of planned change objects
      ...
    }
    ```
* **Error Responses:** `401 Unauthorized`, `403 Forbidden` (Not owner), `404 Not Found`

**4. Update Portfolio**
* **Method:** `PUT` or `PATCH`
* **Path:** `/portfolios/{portfolio_id}`
* **Description:** Updates details for a specific portfolio. Requires Authentication and authorization.
* **Request Body:**
    ```json
    {
      "name": "Updated Portfolio Name",
      "description": "Updated description"
      // Include fields to update
    }
    ```
* **Success Response:** `200 OK`
    ```json
    {
      "portfolio_id": 1,
      "name": "Updated Portfolio Name",
      ... // Updated portfolio details
    }
    ```
* **Error Responses:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

**5. Delete Portfolio**
* **Method:** `DELETE`
* **Path:** `/portfolios/{portfolio_id}`
* **Description:** Deletes a specific portfolio. Requires Authentication and authorization.
* **Request Body:** None
* **Success Response:** `204 No Content` (Or `200 OK` with confirmation message)
* **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

---

## Asset Endpoints (Nested under Portfolios)

*(Similar CRUD endpoints would be defined for assets within a portfolio, e.g.):*

* `POST /portfolios/{portfolio_id}/assets` (Add asset)
* `PUT /portfolios/{portfolio_id}/assets/{asset_id}` (Update asset)
* `DELETE /portfolios/{portfolio_id}/assets/{asset_id}` (Remove asset)

---

## Planned Future Change Endpoints (Nested under Portfolios)

*(Similar CRUD endpoints would be defined for planned changes within a portfolio, e.g.):*

* `POST /portfolios/{portfolio_id}/changes` (Add planned change)
* `PUT /portfolios/{portfolio_id}/changes/{change_id}` (Update planned change)
* `DELETE /portfolios/{portfolio_id}/changes/{change_id}` (Delete planned change)

---

## Projection Endpoint

**1. Run Projection**
* **Method:** `POST`
* **Path:** `/portfolios/{portfolio_id}/projections`
* **Description:** Calculates and returns the future value projection for a specified portfolio using the provided parameters (`start_date`, `end_date`, `initial_total_value`). Requires Authentication and authorization (user must own the portfolio).
* **Request Body:**
    ```json
    {
      "start_date": "2025-01-01",
      "end_date": "2055-01-01",
      "initial_total_value": 10000.00
    }
    ```
* **Success Response:** `200 OK`
    ```json
    [
        { "date": "2025-12-31", "value": 10700.00 },
        { "date": "2026-12-31", "value": 11449.00 },
        // ... more data points
    ]
    ```
* **Error Responses:** `400 Bad Request` (Invalid parameters), `401 Unauthorized`, `403 Forbidden` (Not owner), `404 Not Found` (Portfolio not found), `500 Internal Server Error` (Calculation error)