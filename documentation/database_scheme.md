# Data Model / Database Schema (PostgreSQL)

This document describes the structure of the PostgreSQL database used by the Investment Planning Projection website. The schema is designed to store user information, portfolios, assets, and planned future changes.

## 1. Table: `users`

Stores information about registered users.

* **`id`** (INTEGER, PRIMARY KEY): Unique identifier for the user (Auto-incrementing).
* **`username`** (VARCHAR(64), UNIQUE, INDEX, NOT NULL): User's chosen username.
* **`email`** (VARCHAR(120), UNIQUE, INDEX, NOT NULL): User's email address, can be used for login or password recovery.
* **`password_hash`** (VARCHAR(128), NOT NULL): User's password, securely hashed (e.g., using bcrypt via Werkzeug).
* **`created_at`** (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): Timestamp when the user account was created.

*(Primary Key: `id`, Indexes on: `username`, `email`)*

## 2. Table: `portfolios`

Stores investment portfolios created by users[cite: 10, 43]. Each portfolio belongs to one user.

* **`portfolio_id`** (SERIAL, PRIMARY KEY): Unique identifier for the portfolio.
* **`user_id`** (INTEGER, FOREIGN KEY REFERENCES `users(user_id)`, NOT NULL): Links the portfolio to the owner user.
* **`name`** (VARCHAR(100), NOT NULL): Name given to the portfolio by the user.
* **`description`** (TEXT, NULLABLE): Optional description for the portfolio.
* **`created_at`** (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): Timestamp when the portfolio was created.
* **`updated_at`** (TIMESTAMP WITH TIME ZONE, DEFAULT NOW(), ON UPDATE NOW()): Timestamp when the portfolio was last updated.

*Relationship:* One `users` record can be associated with many `portfolios` records.

## 3. Table: `assets`

Stores the assets within each portfolio, including their allocation[cite: 10, 40, 41]. Each asset belongs to one portfolio.

* **`asset_id`** (SERIAL, PRIMARY KEY): Unique identifier for the asset entry.
* **`portfolio_id`** (INTEGER, FOREIGN KEY REFERENCES `portfolios(portfolio_id)`, NOT NULL): Links the asset to its portfolio.
* **`asset_type`** (VARCHAR(50), NOT NULL): Type of asset (e.g., 'Stock', 'Bond')[cite: 40]. Could use an ENUM type in PostgreSQL.
* **`name_or_ticker`** (VARCHAR(50), NULLABLE): Identifier for the asset (e.g., 'AAPL', 'US Treasury Bond').
* **`allocation_percentage`** (DECIMAL(5, 2), NULLABLE): Weight of this asset in the portfolio (e.g., 60.00 for 60%). Check constraint: 0-100. (Mutually exclusive with `allocation_value`).
* **`allocation_value`** (DECIMAL(15, 2), NULLABLE): Absolute value allocated to this asset. (Mutually exclusive with `allocation_percentage`).
* **`manual_expected_return`** (DECIMAL(5, 2), NULLABLE): User-defined expected annual return for this asset/component (e.g., 7.50 for 7.5%)[cite: 42].
* **`created_at`** (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): Timestamp when the asset was added.

*Relationship:* One `portfolios` record can be associated with many `assets` records.

## 4. Table: `planned_future_changes`

Stores planned future actions for a portfolio, like contributions or withdrawals[cite: 10, 44]. Each change belongs to one portfolio.

* **`change_id`** (SERIAL, PRIMARY KEY): Unique identifier for the planned change.
* **`portfolio_id`** (INTEGER, FOREIGN KEY REFERENCES `portfolios(portfolio_id)`, NOT NULL): Links the change to its portfolio.
* **`change_type`** (VARCHAR(50), NOT NULL): Type of change (e.g., 'Contribution', 'Withdrawal', 'Reallocation')[cite: 44]. Could use an ENUM type.
* **`change_date`** (DATE, NOT NULL): The date the change is planned to occur.
* **`amount`** (DECIMAL(15, 2), NULLABLE): Value associated with the change (e.g., amount for contribution/withdrawal).
* **`description`** (TEXT, NULLABLE): Optional description or details about the change (e.g., details for reallocation).
* **`created_at`** (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()): Timestamp when the planned change was created.

*Relationship:* One `portfolios` record can be associated with many `planned_future_changes` records.

---

**Note:** Specific data types (like VARCHAR lengths, DECIMAL precision) and constraints (like NULLABLE, UNIQUE) might be refined during implementation with SQLAlchemy models. Indexes on foreign keys and frequently queried columns (e.g., `users.email`, `portfolios.user_id`) will be automatically created or should be added for performance.