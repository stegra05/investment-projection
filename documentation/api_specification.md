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

**1. Add Asset to Portfolio**
* **Method:** `POST`
* **Path:** `/portfolios/{portfolio_id}/assets`
* **Description:** Adds a new asset to a specific portfolio. Requires Authentication and authorization.
* **Request Body:**
    ```json
    {
      "asset_type": "Stock", // e.g., Stock, Bond, ETF, etc.
      "name_or_ticker": "AAPL",
      // "allocation_percentage": 60.5, // Optional: Defaults to 0 if neither % nor value is provided
      // "allocation_value": 10000.00, // Optional: Use percentage OR value, not both.
      "manual_expected_return": 7.5 // Optional: Expected annual return percentage
    }
    ```
* **Success Response:** `201 Created` (Returns the newly created asset object)
    ```json
    {
        "asset_id": 101,
        "portfolio_id": 1,
        "asset_type": "Stock",
        "name_or_ticker": "AAPL",
        "allocation_percentage": "0.00", // Example default
        "allocation_value": null,
        "manual_expected_return": "7.50",
        "created_at": "..."
    }
    ```
* **Error Responses:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Portfolio)

**2. Update Asset**
* **Method:** `PUT` or `PATCH`
* **Path:** `/portfolios/{portfolio_id}/assets/{asset_id}`
* **Description:** Updates an existing asset. Requires Authentication and authorization.
* **Request Body:** (Include fields to update)
    ```json
    {
      "name_or_ticker": "Apple Inc.",
      "manual_expected_return": 8.0
      // Note: Updating allocation here might be less common with the new workflow
      // "allocation_percentage": 55.0
    }
    ```
* **Success Response:** `200 OK` (Returns the updated asset object)
* **Error Responses:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Portfolio or Asset)

**3. Delete Asset**
* **Method:** `DELETE`
* **Path:** `/portfolios/{portfolio_id}/assets/{asset_id}`
* **Description:** Removes an asset from a portfolio. Requires Authentication and authorization.
* **Success Response:** `200 OK` or `204 No Content`
* **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Portfolio or Asset)

--- 

## Allocation Endpoints (Nested under Portfolios)

**1. Update Portfolio Allocations**
* **Method:** `PUT`
* **Path:** `/portfolios/{portfolio_id}/allocations`
* **Description:** Updates the allocation percentages for **all** assets within a specific portfolio simultaneously. The sum of percentages must equal 100. Requires Authentication and authorization.
* **Request Body:**
    ```json
    {
      "allocations": [
        { "asset_id": 101, "allocation_percentage": 45.50 },
        { "asset_id": 102, "allocation_percentage": 30.00 },
        { "asset_id": 105, "allocation_percentage": 24.50 }
      ]
    }
    ```
* **Success Response:** `200 OK`
    ```json
    {
        "message": "Allocations updated successfully"
        // Optionally return the updated portfolio or assets
    }
    ```
* **Error Responses:**
    * `400 Bad Request`: Invalid input (e.g., percentages don't sum to 100, missing/invalid asset IDs, payload doesn't include all portfolio assets).
    * `401 Unauthorized`
    * `403 Forbidden` (Not owner)
    * `404 Not Found` (Portfolio)
    * `500 Internal Server Error`

--- 

## Planned Future Change Endpoints (Nested under Portfolios)

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

## Analytics Endpoints (Nested under Portfolios)

**1. Get Portfolio Risk Profile**
* **Method:** `GET`
* **Path:** `/portfolios/{portfolio_id}/analytics/risk-profile`
* **Description:** Retrieves the risk profile analysis for a specific portfolio. Requires Authentication and authorization.
* **Request Body:** None
* **Success Response:** `200 OK`
    ```json
    {
      "risk_score": 0.75,
      "volatility_estimate": 0.15,
      "sharpe_ratio": 1.2,
      "confidence_interval_low_95": -0.05,
      "confidence_interval_high_95": 0.25,
      "calculation_date": "2024-03-21"
    }
    ```
* **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

**2. Get Portfolio Performance**
* **Method:** `GET`
* **Path:** `/portfolios/{portfolio_id}/analytics/performance`
* **Description:** Retrieves historical performance data for a specific portfolio. Requires Authentication and authorization.
* **Query Parameters:**
    - `start_date` (optional): Start date in 'YYYY-MM-DD' format (defaults to 30 days ago)
    - `end_date` (optional): End date in 'YYYY-MM-DD' format (defaults to today)
* **Success Response:** `200 OK`
    ```json
    [
      {"date": "2024-01-01", "cumulative_return": 0.0},
      {"date": "2024-01-02", "cumulative_return": 0.001},
      {"date": "2024-01-03", "cumulative_return": 0.002}
    ]
    ```
* **Error Responses:** `400 Bad Request` (Invalid date format or range), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## Task Endpoints

**1. Get Task Status**
* **Method:** `GET`
* **Path:** `/tasks/{task_id}`
* **Description:** Retrieves the status of a background task. Requires Authentication.
* **Request Body:** None
* **Success Response:** `200 OK`
    ```json
    {
      "task_id": "550e8400e29b41d4a716446655440000",
      "status": "PENDING",
      "result": null,
      "error": null
    }
    ```
* **Possible Status Values:**
    - `PENDING`: Task is queued but not yet started
    - `PROCESSING`: Task is currently being executed
    - `COMPLETED`: Task has finished successfully
    - `FAILED`: Task encountered an error
* **Error Responses:** `401 Unauthorized`, `404 Not Found`

## Projection Endpoints (Nested under Portfolios)

**1. Create Portfolio Projection**
* **Method:** `POST`
* **Path:** `/portfolios/{portfolio_id}/projections`
* **Description:** Initiates a portfolio projection calculation task. Requires Authentication and authorization.
* **Request Body:**
    ```json
    {
      "start_date": "2024-01-01",
      "end_date": "2024-12-31",
      "initial_total_value": "100000.00"
    }
    ```
* **Success Response:** `202 Accepted`
    ```json
    {
      "message": "Projection task accepted",
      "task_id": "550e8400e29b41d4a716446655440000"
    }
    ```
* **Error Responses:** `400 Bad Request` (Invalid input), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`