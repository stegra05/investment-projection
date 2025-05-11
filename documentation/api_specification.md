# API Specification (Summary)

This document outlines the key API endpoints for the Investment Planning Projection website, facilitating communication between the React frontend and the Flask backend.

**Base Path:** `/api/v1/`
**(All API paths in this document are relative to this base path)**

**Authentication Mechanism:**
Most endpoints (excluding public ones like registration/login) require authentication using **JWT (JSON Web Tokens)**.
- The `access_token` **MUST** be sent in the `Authorization` header as a Bearer token (e.g., `Authorization: Bearer <your_access_token>`).
- The `refresh_token` for the `/auth/refresh` endpoint is handled via secure, HttpOnly cookies.
Unauthenticated requests to protected endpoints **MUST** return a `401 Unauthorized` status.

**Data Types & Field Conventions:**
- **Data Types:** This specification will endeavor to clearly define data types for all request and response fields (e.g., `string`, `integer`, `number` (often a decimal represented as a `string` for precision), `boolean`, `date` (formatted as "YYYY-MM-DD" `string`), `datetime` (formatted as "YYYY-MM-DDTHH:MM:SSZ" `string` - ISO 8601), `enum` (with specific allowed `string` values listed)).
- **Required vs. Optional Fields:** For all request body schemas, each field will be explicitly marked as "required" or "optional."
- **Enum Values:** For fields representing enumerations (e.g., `asset_type`, `change_type`, recurrence fields), the valid `string` values the API expects or returns will be listed. These are defined in `backend/app/enums.py`.

**Standard Error Response Structure:**
While specific error messages may vary, the backend aims to provide a consistent JSON error response structure.
- For client-side errors (e.g., `400 Bad Request`, `404 Not Found`), the body will typically contain:
  ```json
  {
    "message": "A human-readable error summary"
    // "details": "Optional field for more specific information or validation errors"
  }
  ```
- For `400 Bad Request` due to input validation failures, the response will usually include detailed error information:
  ```json
  // Example for 400 Bad Request (Validation Error)
  {
    "message": "Invalid input data",
    "errors": [
      {
        "loc": ["field_name", "nested_field_name_if_any"], // Location of the error
        "msg": "Specific error message for this field",   // Human-readable message
        "type": "validation_error_type"                  // Internal error type identifier
      }
      // ... potentially more error objects for other fields
    ]
  }
  ```
- `401 Unauthorized`, `403 Forbidden` will typically have a `message` explaining the authentication/authorization failure.
- `500 Internal Server Error` responses will generally have a generic error message to avoid exposing sensitive details, with specifics logged server-side.

---

## Authentication Endpoints

**1. Register User**
* **Method:** `POST`
* **Path:** `/auth/register`
* **Description:** Creates a new user account.
* **Request Body:**
    ```json
    {
      "email": "user@example.com", // string, required, valid email format
      "username": "newuser", // string, required, min_length: 3, max_length: 64, alphanumeric (assuming it's required based on common UserRegistrationSchema practice)
      "password": "securePassword123" // string, required, min_length: 8, must include uppercase, lowercase, digit, and special character
    }
    ```
* **Success Response:** `201 Created`
    ```json
    {
      "message": "User registered successfully.",
      "user": {
        "user_id": 123, // integer
        "email": "user@example.com", // string
        "username": "newuser", // string
        "created_at": "2024-03-15T10:00:00Z" // string, datetime ISO 8601
      }
    }
    ```
* **Error Responses:** `400 Bad Request` (Invalid input, missing fields, weak password, username/email format incorrect), `409 Conflict` (Email or username already exists)

**2. Login User**
* **Method:** `POST`
* **Path:** `/auth/login`
* **Description:** Authenticates a user and returns an access token in the response body and a refresh token as an HttpOnly cookie.
* **Request Body:**
    *The client **MUST** send either `email` OR `username` (not both) along with the `password`.*
    *Example 1: Login with Email*
    ```json
    {
      "email": "user@example.com", // string, required if username not present
      "password": "securePassword123" // string, required
    }
    ```
    *Example 2: Login with Username*
    ```json
    {
      "username": "existinguser", // string, required if email not present
      "password": "securePassword123" // string, required
    }
    ```
* **Success Response:** `200 OK`
    ```json
    {
      "message": "Login successful.",
      "access_token": "your_jwt_access_token_here", // string, JWT
      "user": { // Optional: Information about the logged-in user
        "user_id": 123, // integer
        "email": "user@example.com", // string
        "username": "existinguser" // string
      }
      // Note: The refresh_token is set as an HttpOnly cookie by the server, not included in this JSON response.
    }
    ```
* **Error Responses:** `400 Bad Request` (Missing fields, invalid input), `401 Unauthorized` (Invalid credentials)

**3. Refresh Token**
* **Method:** `POST`
* **Path:** `/auth/refresh`
* **Description:** Obtains a new access token using a valid refresh token. 
* **Authentication:** This endpoint **requires** a valid `refresh_token` to be sent by the client as an HttpOnly cookie (and associated CSRF protection token if applicable).
* **Request Body:** None (The `refresh_token` is expected in an HttpOnly cookie).
* **Success Response:** `200 OK`
    ```json
    {
      "access_token": "new_jwt_access_token_here" // string, JWT
    }
    ```
* **Error Responses:** `401 Unauthorized` (Invalid, expired, or missing refresh token cookie)

**4. Logout User**
* **Method:** `POST`
* **Path:** `/auth/logout`
* **Description:** Invalidates the user's refresh token (typically by clearing the refresh token cookie or server-side revocation). Access tokens are stateless and rely on their expiration time. Requires Authentication via Access Token.
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
* **Query Parameters (Optional):**
    * `page` (integer, default: 1, min: 1): For pagination, the page number to retrieve.
    * `per_page` (integer, default: 10, min: 1, max: 100): For pagination, the number of items per page.
    * `sort_by` (string, default: "created_at", allowed: "name", "created_at", "updated_at"): Field to sort by.
    * `sort_order` (string, default: "desc", allowed: "asc", "desc"): Sort order.
    * `filter_name` (string, optional, min_length: 1, max_length: 100): Filter portfolios by name (case-insensitive, partial match).
* **Request Body:** None
* **Success Response:** `200 OK`
    ```json
    {
      "data": [
        {
          "portfolio_id": 1, // integer
          "name": "Retirement Plan", // string
          "description": "My long term retirement savings", // string, optional
          "user_id": 123, // integer (owner)
          "created_at": "2024-03-10T09:00:00Z", // string, datetime ISO 8601
          "updated_at": "2024-03-12T14:30:00Z", // string, datetime ISO 8601
          "totalValue": "150000.00" // string, decimal (calculated summary. Field name matches PortfolioSchema alias)
          // "assets" and "planned_changes" are not returned in the list view.
          // Use GET /portfolios/{portfolio_id} with include parameters for full details.
        },
        {
          "portfolio_id": 2,
          "name": "House Fund",
          "description": null,
          "user_id": 123,
          "created_at": "2024-02-01T11:00:00Z",
          "updated_at": "2024-02-01T11:00:00Z",
          "totalValue": "75000.00"
          // "assets" and "planned_changes" are not returned in the list view.
        }
      ],
      "pagination": {
        "page": 1,
        "per_page": 10,
        "total_pages": 1, // Example value, will depend on total_items and per_page
        "total_items": 2, // Example value
        "next_page": null, // Example value, URL or page number
        "prev_page": null, // Example value, URL or page number
        "has_next": false, // boolean
        "has_prev": false  // boolean
      }
    }
    ```
* **Error Responses:** `400 Bad Request` (Invalid query parameters), `401 Unauthorized`

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
* **Description:** Retrieves details for a specific portfolio. Requires Authentication and authorization (user must own the portfolio).
* **Query Parameters (Optional):**
    * `include` (string): Specifies which related entities to include in the response. Default: `full`.
        * Valid values:
            * `summary`: Returns only the portfolio's top-level details without `assets` or `planned_changes` arrays.
            * `assets`: Includes the `assets` array, populated with asset objects (conforming to `AssetSchema`). `planned_changes` might be empty or omitted.
            * `changes`: Includes the `planned_changes` array, populated with planned change objects (conforming to `PlannedChangeSchema`). `assets` might be empty or omitted.
            * `full`: Includes both `assets` and `planned_changes` arrays fully populated.
* **Request Body:** None
* **Success Response:** `200 OK`
    *Example (with `include=full` or default):*
    ```json
    {
      "portfolio_id": 1, // integer
      "name": "Retirement Plan", // string
      "description": "My long term retirement savings", // string, optional
      "user_id": 123, // integer
      "created_at": "2024-03-10T09:00:00Z", // string, datetime ISO 8601
      "updated_at": "2024-03-12T14:30:00Z", // string, datetime ISO 8601
      "totalValue": "150000.00", // string, decimal (calculated summary. Field name matches PortfolioSchema alias)
      "assets": [
        { 
          "asset_id": 101, 
          "portfolio_id": 1,
          "asset_type": "Stock", // string, enum
          "name_or_ticker": "AAPL", // string
          "allocation_percentage": "60.00", // string, decimal
          "allocation_value": null, // string, decimal or null
          "manual_expected_return": "7.50", // string, decimal or null
          "created_at": "2024-03-11T09:00:00Z", // string, datetime ISO 8601
          "updated_at": "2024-03-11T09:00:00Z"  // string, datetime ISO 8601
        }
      ],
      "planned_changes": [
        { 
          "change_id": 201,
          "portfolio_id": 1,
          "change_type": "Contribution", // string, enum
          "change_date": "2024-08-01", // string, date YYYY-MM-DD
          "amount": "500.00", // string, decimal
          "is_recurring": false, // boolean
          // ... other relevant non-null planned change fields for a non-recurring contribution
          "created_at": "2024-03-12T10:00:00Z", // string, datetime ISO 8601
          "updated_at": "2024-03-12T10:00:00Z"  // string, datetime ISO 8601
        }
      ]
    }
    ```
    *Example (with `include=summary`):*
    ```json
    {
      "portfolio_id": 1,
      "name": "Retirement Plan",
      "description": "My long term retirement savings",
      "user_id": 123,
      "created_at": "2024-03-10T09:00:00Z",
      "updated_at": "2024-03-12T14:30:00Z",
      "totalValue": "150000.00"
      // assets and planned_changes arrays would be omitted or empty
    }
    ```
    *Example (with `include=assets`):*
    ```json
    {
      "portfolio_id": 1,
      "name": "Retirement Plan",
      // ... other portfolio fields
      "assets": [
        { "asset_id": 101, "name_or_ticker": "AAPL", ... }
      ],
      "planned_changes": [] // or omitted
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
      "asset_type": "Stock", // string, required, enum. Valid values: ["Stock", "Bond", "Mutual Fund", "ETF", "Real Estate", "Cash", "Cryptocurrency", "Options", "Other"]
      "name_or_ticker": "AAPL", // string, required
      "allocation_percentage": "60.50", // string, optional, decimal between "0.00" and "100.00". See allocation rules.
      "allocation_value": "10000.00", // string, optional, decimal >= "0.00". See allocation rules.
      "manual_expected_return": "7.5" // string, optional, decimal representing annual return percentage (e.g., "7.5" for 7.5%)
    }
    ```
    *Allocation Exclusivity & Defaults:*
    *   It is **strongly recommended** to provide EITHER `allocation_percentage` OR `allocation_value`, but not both non-null.
    *   If `allocation_percentage` is set (non-null), any provided `allocation_value` will typically be ignored and set to `null` by the backend (due to model validators).
    *   If `allocation_value` is set (non-null), any provided `allocation_percentage` will typically be ignored and set to `null` by the backend.
    *   If both are sent non-null, the backend's behavior (which field takes precedence and which is nulled) depends on internal validation order; to ensure predictable behavior, send only one.
    *   If neither is provided, `allocation_percentage` defaults to `"0.00"` and `allocation_value` will be `null`.
* **Success Response:** `201 Created` (Returns the newly created asset object)
    ```json
    {
        "asset_id": 101, // integer
        "portfolio_id": 1, // integer
        "asset_type": "Stock", // string, enum
        "name_or_ticker": "AAPL", // string
        "allocation_percentage": "60.50", // string, decimal (or "0.00" if defaulted, or null if value was prioritized)
        "allocation_value": null, // string, decimal (or populated if value was provided and percentage was null)
        "manual_expected_return": "7.50", // string, decimal (formatted to two decimal places)
        "created_at": "2024-03-15T10:00:00Z", // string, datetime ISO 8601
        "updated_at": "2024-03-15T10:00:00Z" // string, datetime ISO 8601
    }
    ```
* **Error Responses:** `400 Bad Request` (Invalid input, validation errors), `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Portfolio)

**2. Update Asset**
* **Method:** `PUT` or `PATCH` (`PUT` here accepts partial updates of the asset resource, similar to `PATCH`. Clients can send only the fields they wish to change.)
* **Path:** `/portfolios/{portfolio_id}/assets/{asset_id}`
* **Description:** Updates an existing asset. Requires Authentication and authorization. Only fields to be updated need to be sent.
* **Request Body:** (Include fields to update, all are optional)
    ```json
    {
      "asset_type": "Stock", // string, optional, enum. Valid values: ["Stock", "Bond", "Mutual Fund", "ETF", "Real Estate", "Cash", "Cryptocurrency", "Options", "Other"]
      "name_or_ticker": "Apple Inc.", // string, optional
      "allocation_percentage": "55.00", // string, optional, decimal. See allocation update rules.
      "allocation_value": null, // string, optional, decimal or null. See allocation update rules.
      "manual_expected_return": "8.0" // string, optional, decimal
    }
    ```
    *Allocation Exclusivity on Update:*
    *   Similar to adding an asset, if `allocation_percentage` is updated to a non-null value, `allocation_value` will be set to `null` by the backend validator.
    *   If `allocation_value` is updated to a non-null value, `allocation_percentage` will be set to `null` by the backend validator.
    *   It's recommended to only send one of these fields for update if changing allocation basis, or set one to `null` explicitly if switching.
* **Success Response:** `200 OK` (Returns the updated asset object)
    ```json
    {
        "asset_id": 101,
        "portfolio_id": 1,
        "asset_type": "Stock",
        "name_or_ticker": "Apple Inc.",
        "allocation_percentage": "55.00",
        "allocation_value": null,
        "manual_expected_return": "8.00",
        "created_at": "2024-03-15T10:00:00Z", // Original creation date
        "updated_at": "2024-03-15T10:05:00Z"  // Timestamp of this update
    }
    ```
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
* **Description:** Updates the allocation percentages for **all** assets within a specific portfolio simultaneously. Requires Authentication and authorization.
* **Request Body:**
    ```json
    {
      "allocations": [
        { "asset_id": 101, "allocation_percentage": "45.50" }, // asset_id: integer, required; allocation_percentage: string (decimal), required
        { "asset_id": 102, "allocation_percentage": "30.00" },
        { "asset_id": 105, "allocation_percentage": "24.50" }
      ]
    }
    ```
    *Validation Rules:*
    *   The `allocation_percentage` for each asset must be a string representation of a decimal (e.g., "45.50").
    *   The sum of all `allocation_percentage` values in the `allocations` array **MUST** be exactly `"100.00"`. (While the backend might have a small tolerance for floating-point inaccuracies, e.g., summing to 99.99% or 100.01%, the target sum for client input is '100.00%').
    *   The `allocations` array **MUST** include an entry for **EVERY** asset currently belonging to the specified portfolio. Omitting an asset that exists in the portfolio, or including an `asset_id` that does not belong to the portfolio, will result in a `400 Bad Request`.
    *   Upon successful update, the `allocation_value` for all assets in the portfolio will be set to `null`, as these allocations are now strictly percentage-based.
* **Success Response:** `200 OK`
    ```json
    {
        "message": "Allocations updated successfully",
        "portfolio": { // The updated portfolio object
            "portfolio_id": 1,
            "name": "Retirement Plan",
            // ... other portfolio fields ...
            "totalValue": "150000.00", // May or may not be recalculated/affected by allocation-only update
            "updated_at": "2024-03-15T11:00:00Z",
            "assets": [
                {
                    "asset_id": 101,
                    "name_or_ticker": "AAPL",
                    "allocation_percentage": "45.50",
                    "allocation_value": null,
                    // ... other asset fields ...
                    "updated_at": "2024-03-15T11:00:00Z"
                },
                {
                    "asset_id": 102,
                    "name_or_ticker": "MSFT",
                    "allocation_percentage": "30.00",
                    "allocation_value": null,
                    // ... other asset fields ...
                    "updated_at": "2024-03-15T11:00:00Z"
                },
                {
                    "asset_id": 105,
                    "name_or_ticker": "GOOGL",
                    "allocation_percentage": "24.50",
                    "allocation_value": null,
                    // ... other asset fields ...
                    "updated_at": "2024-03-15T11:00:00Z"
                }
            ]
        }
    }
    ```
* **Error Responses:**
    * `400 Bad Request`: Invalid input (e.g., percentages don't sum to 100, missing/invalid asset IDs, payload doesn't include all portfolio assets, incorrect data types).

--- 

## Planned Future Change Endpoints (Nested under Portfolios)

These endpoints manage scheduled future changes to a portfolio, such as recurring contributions, withdrawals, or reallocations. All paths are prefixed with `/portfolios/{portfolio_id}/changes`.

*   **Authentication:** All endpoints in this section require Authentication and Authorization (user must own the portfolio).
*   **Enum Placeholders:** Enum values mentioned below (e.g., `app.enums.PlannedChangeType`) are placeholders and should be replaced with actual values from `backend/app/enums.py`.

**1. Add Planned Change**
*   **Method:** `POST`
*   **Path:** `/` (i.e., `/portfolios/{portfolio_id}/changes/`)
*   **Description:** Adds a new planned future change to a specific portfolio.
*   **Request Body:** (Based on `PlannedChangeCreateSchema`)
    ```json
    {
      "change_type": "Contribution", // string, required, enum. Valid values: ["Contribution", "Withdrawal", "Reallocation", "Dividend", "Interest"]
      "change_date": "2025-01-15", // string, required, "YYYY-MM-DD" format (start date for recurring changes)
      "amount": "500.00", // string (decimal), conditionally required. Required if change_type is 'Contribution' or 'Withdrawal'. Must be null or omitted if change_type is 'Reallocation'.
      "target_allocation_json": null, // JSON object (dictionary), conditionally required. Required and used only if change_type is 'Reallocation'. Must be null or omitted otherwise.
                                      // Structure **MUST** be: { "asset_id_as_string_key": "percentage_as_string_value", ... }
                                      // Example: { "101": "50.00", "102": "50.00" } (asset IDs are strings, percentages are strings, sum to "100.00").
                                      // Frontend representations (e.g., array of objects) MUST be transformed to this dictionary structure.
      "description": "Monthly savings contribution", // string, optional, max_length: 255
      "is_recurring": true, // boolean, optional, defaults to false if not sent.
      // --- Recurrence Fields (conditionally required if is_recurring is true) ---
      "frequency": "MONTHLY", // string, enum, optional, defaults to 'ONE_TIME' if is_recurring is false. Required if is_recurring is true. Valid values: ["ONE_TIME", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"]
      "interval": 1, // integer, optional, default: 1. Required if is_recurring is true and frequency is not 'ONE_TIME'. Must be >= 1.
      "days_of_week": null, // array of integers, optional. Used only if frequency is 'WEEKLY'. (0=Monday, 1=Tuesday, ..., 6=Sunday). Example: [0, 2, 4] for Mon, Wed, Fri.
      "day_of_month": 15, // integer, optional, [1-31]. Used if frequency is 'MONTHLY' and recurrence is by a specific day number.
      "month_ordinal": null, // string, enum, optional. Used if frequency is 'MONTHLY' or 'YEARLY' for ordinal recurrence. Valid values: ["FIRST", "SECOND", "THIRD", "FOURTH", "LAST"]
      "month_ordinal_day": null, // string, enum, optional. Used with month_ordinal. Valid values: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY", "DAY", "WEEKDAY", "WEEKEND_DAY"]
      "month_of_year": null, // integer, optional, [1-12]. Used only if frequency is 'YEARLY'.
      "ends_on_type": "AFTER_OCCURRENCES", // string, enum, required if is_recurring is true. Valid values: ["NEVER", "AFTER_OCCURRENCES", "ON_DATE"]
      "ends_on_occurrences": 12, // integer, optional, must be >= 1. Used only if ends_on_type is 'AFTER_OCCURRENCES'.
      "ends_on_date": null // string, "YYYY-MM-DD", optional. Used only if ends_on_type is 'ON_DATE'.
    }
    ```
*   **Success Response:** `201 Created` (Returns the newly created planned change object)
    ```json
    {
      "change_id": 301, // integer
      "portfolio_id": 1, // integer
      "change_type": "Contribution",
      "change_date": "2025-01-15",
      "amount": "500.00",
      "target_allocation_json": null,
      "description": "Monthly savings contribution",
      "is_recurring": true,
      "frequency": "MONTHLY",
      "interval": 1,
      "days_of_week": null,
      "day_of_month": 15,
      "month_ordinal": null,
      "month_ordinal_day": null,
      "month_of_year": null,
      "ends_on_type": "AFTER_OCCURRENCES",
      "ends_on_occurrences": 12,
      "ends_on_date": null,
      "created_at": "2024-03-15T10:00:00Z", // string, datetime ISO 8601
      "updated_at": "2024-03-15T10:00:00Z"  // string, datetime ISO 8601
    }
    ```
*   **Error Responses:**
    *   `400 Bad Request`: Invalid input, validation failure (e.g., missing conditional fields, invalid enum values, logical conflicts in recurrence rules, `change_date` in past for new non-recurring change).
    *   `401 Unauthorized`
    *   `403 Forbidden`
    *   `404 Not Found` (Portfolio)

**2. Update Planned Change**
*   **Method:** `PUT` (or `PATCH` - clarify if both supported. `PlannedChangeUpdateSchema` suggests partial updates are intended for `PUT`)
*   **Path:** `/{change_id}/` (i.e., `/portfolios/{portfolio_id}/changes/{change_id}/`)
*   **Description:** Updates an existing planned change. Send only the fields to be modified.
*   **Request Body:** (Based on `PlannedChangeUpdateSchema`, all fields are optional)
    ```json
    {
      "change_type": "Withdrawal", // string, optional, enum
      "change_date": "2025-02-01", // string, optional, "YYYY-MM-DD"
      "amount": "200.00", // string (decimal), optional
      // ... any other fields from the "Add Planned Change" request body can be included if they need updating
      "description": "Updated description", // string, optional
      "ends_on_occurrences": 10 // integer, optional
    }
    ```
    *Updating `change_type` might require other fields to be provided or nulled out (e.g., changing from 'Contribution' to 'Reallocation' would make `amount` invalid and `target_allocation_json` potentially required).*
*   **Success Response:** `200 OK` (Returns the updated planned change object)
    ```json
    {
      "change_id": 301,
      "portfolio_id": 1,
      "change_type": "Withdrawal",
      "change_date": "2025-02-01",
      "amount": "200.00",
      "target_allocation_json": null, // Assuming it was null and not changed to Reallocation
      "description": "Updated description",
      "is_recurring": true, // Assuming this was not changed
      "frequency": "MONTHLY", // Assuming this was not changed
      "interval": 1,
      "day_of_month": 15, // Assuming this was not changed
      "ends_on_type": "AFTER_OCCURRENCES",
      "ends_on_occurrences": 10,
      "created_at": "2024-03-15T10:00:00Z",
      "updated_at": "2024-03-15T10:05:00Z" // Note: updated_at timestamp will change
    }
    ```
*   **Error Responses:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Portfolio or Change)

**3. Delete Planned Change**
*   **Method:** `DELETE`
*   **Path:** `/{change_id}/` (i.e., `/portfolios/{portfolio_id}/changes/{change_id}/`)
*   **Description:** Deletes a specific planned change from a portfolio.
*   **Request Body:** None
*   **Success Response:** `204 No Content` (Alternatively, `200 OK` with a confirmation message, but `204` is common for DELETE)
*   **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (Portfolio or Change)

--- 

## Projection Endpoint

**1. Run Projection (Task-Based)**
* **Method:** `POST`
* **Path:** `/portfolios/{portfolio_id}/projections`
* **Description:** Initiates a portfolio projection calculation as a background task. Requires Authentication and authorization (user must own the portfolio).
* **Request Body:**
    ```json
    {
      "start_date": "2025-01-01", // string, required, "YYYY-MM-DD" format
      "end_date": "2055-01-01",   // string, required, "YYYY-MM-DD" format. Must be after start_date.
      "initial_total_value": "10000.00" // string (decimal), required, must be >= "0.00"
    }
    ```
* **Success Response:** `202 Accepted`
    ```json
    {
      "message": "Projection task accepted",
      "task_id": "your_unique_task_id_here" // string, UUID
    }
    ```
* **Error Responses:** `400 Bad Request` (Invalid parameters e.g., `end_date` not after `start_date`, `initial_total_value` negative, invalid date format), `401 Unauthorized`, `403 Forbidden` (Not owner), `404 Not Found` (Portfolio not found), `500 Internal Server Error` (Task initiation failed)

**2. Get Projection Preview (Direct Calculation)**
* **Method:** `POST`
* **Path:** `/portfolios/{portfolio_id}/projections/preview`
* **Description:** Calculates and returns a portfolio projection preview directly. This is a synchronous operation. Requires Authentication and authorization.
* **Request Body:**
    ```json
    {
      "start_date": "2025-01-01", // string, required, "YYYY-MM-DD"
      "end_date": "2030-01-01",   // string, required, "YYYY-MM-DD". Must be after start_date.
      "initial_total_value": "10000.00", // string (decimal), required, >= "0.00"
      "draft_planned_changes": [ // array, optional. Each object conforms to the "Add Planned Change" request body structure.
        {
          "change_type": "Contribution",
          "change_date": "2025-02-01",
          "amount": "100.00",
          "is_recurring": true,
          "frequency": "MONTHLY",
          "interval": 1,
          "day_of_month": 1,
          "ends_on_type": "NEVER"
          // ... other fields as per Add Planned Change schema ...
        }
        // ... more draft planned change objects ...
      ]
    }
    ```
* **Success Response:** `200 OK`
    ```json
    [
        { "date": "2025-12-31", "value": "10700.00" }, // date: string "YYYY-MM-DD", value: string (decimal)
        { "date": "2026-12-31", "value": "11449.00" },
        // ... more data points for each period end (e.g., end of year or end of month, depending on projection granularity)
    ]
    ```
* **Error Responses:**
    * `400 Bad Request`: Invalid parameters (e.g., `end_date` not after `start_date`, negative `initial_total_value`, invalid `draft_planned_changes` structure or values).
    * `401 Unauthorized`
    * `403 Forbidden` (Not owner)
    * `404 Not Found` (Portfolio not found)
    * `500 Internal Server Error` (Calculation error during preview)

## Analytics Endpoints (Nested under Portfolios)

**1. Get Portfolio Risk Profile**
* **Method:** `GET`
* **Path:** `/portfolios/{portfolio_id}/analytics/risk-profile`
* **Description:** Retrieves the risk profile analysis for a specific portfolio. Requires Authentication and authorization.
* **Request Body:** None
* **Success Response:** `200 OK`
    ```json
    {
      "risk_score": 0.75, // number (float/double)
      "volatility_estimate": 0.15, // number (float/double), expected annual volatility
      "sharpe_ratio": 1.2, // number (float/double)
      "confidence_interval_low_95": -0.05, // number (float/double), 95% confidence interval lower bound for returns
      "confidence_interval_high_95": 0.25, // number (float/double), 95% confidence interval upper bound for returns
      "calculation_date": "2024-03-21" // string, "YYYY-MM-DD" format, date of the last calculation
    }
    ```
* **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

**2. Get Portfolio Performance**
* **Method:** `GET`
* **Path:** `/portfolios/{portfolio_id}/analytics/performance`
* **Description:** Retrieves historical or simulated performance data for a specific portfolio. Requires Authentication and authorization.
* **Query Parameters:**
    * `start_date` (string, optional): Start date in "YYYY-MM-DD" format. Defaults to 30 days prior to the current date if not provided.
    * `end_date` (string, optional): End date in "YYYY-MM-DD" format. Defaults to the current date if not provided. Cannot be in the future.
    * *Validation Note:* `start_date` must be before or equal to `end_date`.
* **Success Response:** `200 OK`
    ```json
    [
      {"date": "2024-01-01", "cumulative_return": 0.0}, // cumulative_return: number (float/double), representing total return since start_date (e.g., 0.05 for 5%)
      {"date": "2024-01-02", "cumulative_return": 0.001},
      {"date": "2024-01-03", "cumulative_return": 0.002}
      // ... more data points, typically daily or monthly depending on range and backend logic
    ]
    ```
* **Error Responses:** `400 Bad Request` (Invalid date format or range), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`

## Task Endpoints

**1. Get Task Status**
* **Method:** `GET`
* **Path:** `/tasks/{task_id}`
* **Description:** Retrieves the status of a background task (e.g., a portfolio projection). Requires Authentication.
* **Request Body:** None
* **Success Response:** `200 OK`
    *Example for a **pending/processing** task or a **failed** task:*
    ```json
    {
      "task_id": "550e8400e29b41d4a716446655440000", // string, UUID
      "status": "PENDING", // string, enum: PENDING, PROCESSING, FAILED
      "result": null, // object, null if not completed or failed with no specific result data
      "error": null // string or object, null if no error, or error message/details if status is FAILED
    }
    ```
    *Example for a **COMPLETED projection** task:*
    ```json
    {
      "task_id": "550e8400e29b41d4a716446655440000", // string, UUID
      "status": "COMPLETED", // string, enum: COMPLETED
      "result": {
        "message": "Projection calculated successfully.", // string, optional general message
        "data": { // object, contains the actual projection results. Dates are keys, string decimal values are values.
          "2025-12-31": "10700.00", 
          "2026-12-31": "11449.00"
          // ... more date-value pairs, matching the output of the direct projection preview
        }
      },
      "error": null
    }
    ```
* **Possible Status Values:**
    - `PENDING`: Task is queued but not yet started
    - `PROCESSING`: Task is currently being executed
    - `COMPLETED`: Task has finished successfully (result will be populated)
    - `FAILED`: Task encountered an error (error field will be populated)
* **Error Responses:** `401 Unauthorized`, `404 Not Found` (Task ID does not exist)