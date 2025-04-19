# Test Plan & Test Cases

## 1. Test Strategy

* **Scope:** Testing will primarily focus on the "Must-have" functional requirementsdefined in `functional_requirements.txt` [source: 33] to ensure the core application is reliable and meets its essential goals. Key non-functional requirements, particularly Securityand Usability, will also be explicitly tested. Should-have features will be tested if time permits ("exploratory testing").
* **Testing Types:**
    * **Unit Testing:** Backend (Flask) functions and models will be tested using **Pytest**[cite: 163]. Frontend (React) components and utility functions will be tested using **Jest**[cite: 162]. Focus on critical logic like calculations and state management.
    * **Integration Testing:** Testing the interaction between the React frontend and Flask backend API endpoints. Verifying data flow for core features like authentication, portfolio management, and projections. Testing database interactions via the backend.
    * **Manual Testing:** Performing end-to-end tests by interacting with the application through the browser, simulating user workflows. Essential for usability testingand verifying visual elements.
    * **Security Testing:** Basic security checks focusing on authentication[cite: 70], authorization, input validation, password security[cite: 71], and HTTPS usage[cite: 72].
    * **Performance Testing (Basic):** Manually observing calculation times [cite: 67] and page load speeds [cite: 68] for responsiveness, ensuring they meet the NFR targets.
* **Tools:** Pytest[cite: 163], Jest[cite: 162], Web Browser Developer Tools.
* **Environment:** Testing will primarily occur in the local development environment. Final verification will happen in the staging/production environment post-deployment.

## 2. Test Cases

*(Focus on Must-Have Featuresand Key NFRs [cite: 63])*

---

**Feature:** User Registration & Login (M-7[cite: 46], SEC-1[cite: 70], SEC-2 [cite: 71])

* **Test Case ID:** TC-AUTH-001
* **Description:** Verify successful user registration with valid details.
* **Steps:**
    1.  Navigate to the Registration page.
    2.  Enter a unique email, valid password, and confirm password.
    3.  Click Register/Submit.
* **Expected Result:** Account created successfully. User is redirected to login or dashboard. User record exists in the database with a hashed password.
* **Priority:** High

* **Test Case ID:** TC-AUTH-002
* **Description:** Verify registration failure with existing email.
* **Steps:**
    1.  Navigate to the Registration page.
    2.  Enter an email address already registered.
    3.  Enter password and confirm password.
    4.  Click Register/Submit.
* **Expected Result:** Registration fails. Appropriate error message displayed ("Email already exists" or similar).
* **Priority:** High

* **Test Case ID:** TC-AUTH-003
* **Description:** Verify successful login with valid credentials.
* **Steps:**
    1.  Navigate to the Login page.
    2.  Enter valid registered email and correct password.
    3.  Click Login/Submit.
* **Expected Result:** Login successful. User is redirected to the main application dashboard/portfolio view. Session/token is established.
* **Priority:** High

* **Test Case ID:** TC-AUTH-004
* **Description:** Verify login failure with invalid password.
* **Steps:**
    1.  Navigate to the Login page.
    2.  Enter valid registered email and incorrect password.
    3.  Click Login/Submit.
* **Expected Result:** Login fails. Appropriate error message displayed ("Invalid credentials" or similar).
* **Priority:** High

* **Test Case ID:** TC-AUTH-005
* **Description:** Verify password hashing in the database.
* **Steps:**
    1.  Register a new user.
    2.  Access the database directly (development environment).
    3.  Check the password field for the new user record.
* **Expected Result:** The password stored in the database is a long hash string (bcrypt output), not the plain text password[cite: 71].
* **Priority:** High

---

**Feature:** Portfolio Management (CRUD) (M-4 [cite: 43])

* **Test Case ID:** TC-PORT-001
* **Description:** Verify successful creation of a new portfolio.
* **Steps:**
    1.  Log in as a registered user.
    2.  Navigate to the portfolio management area.
    3.  Click "Create New Portfolio".
    4.  Enter a portfolio name and any other required initial details.
    5.  Save the portfolio.
* **Expected Result:** Portfolio is created successfully and appears in the user's list of portfolios. Data is saved correctly in the database.
* **Priority:** High

* **Test Case ID:** TC-PORT-002
* **Description:** Verify viewing details of an existing portfolio.
* **Steps:**
    1.  Log in.
    2.  Select an existing portfolio from the list.
* **Expected Result:** Portfolio details (name, assets, planned changes etc.) are displayed correctly.
* **Priority:** High

* **Test Case ID:** TC-PORT-003
* **Description:** Verify successful editing of an existing portfolio's details (e.g., name).
* **Steps:**
    1.  Log in.
    2.  Select an existing portfolio.
    3.  Click "Edit" or similar.
    4.  Modify the portfolio name.
    5.  Save changes.
* **Expected Result:** Changes are saved successfully. Updated name is reflected in the portfolio list and details view. Database record is updated.
* **Priority:** High

* **Test Case ID:** TC-PORT-004
* **Description:** Verify successful deletion of a portfolio.
* **Steps:**
    1.  Log in.
    2.  Select an existing portfolio.
    3.  Click "Delete" or similar.
    4.  Confirm deletion if prompted.
* **Expected Result:** Portfolio is removed from the list. Database record is deleted (or marked inactive).
* **Priority:** High

---

**Feature:** Asset & Allocation Management (M-1[cite: 40], M-2 [cite: 41])

* **Test Case ID:** TC-ASSET-001
* **Description:** Verify adding a core asset (Stock/Bond) to a portfolio with allocation.
* **Steps:**
    1.  Log in and select a portfolio.
    2.  Navigate to asset management for the portfolio.
    3.  Select "Stock" or "Bond".
    4.  Specify asset details (e.g., name/ticker if applicable) and allocation (weight/amount).
    5.  Save the asset.
* **Expected Result:** Asset is added to the portfolio view with correct details and allocation. Data is saved in the database.
* **Priority:** High

---

**Feature:** Future Change Planning (M-5 [cite: 44])

* **Test Case ID:** TC-CHANGE-001
* **Description:** Verify adding a future change (e.g., contribution) to a portfolio.
* **Steps:**
    1.  Log in and select a portfolio.
    2.  Navigate to future change planning.
    3.  Define a change (type: contribution, amount: $500, date: future date).
    4.  Save the change.
* **Expected Result:** The planned change appears in the list of future changes for the portfolio. Data is saved in the database.
* **Priority:** High

---

**Feature:** Projection Visualization (M-6[cite: 45], P-1[cite: 67], P-2[cite: 68], DA-1 [cite: 76])

* **Test Case ID:** TC-PROJ-001
* **Description:** Verify successful generation and display of a projection graph.
* **Steps:**
    1.  Log in and select a portfolio with assets, allocation, return assumptions[cite: 42], and planned changes[cite: 44].
    2.  Navigate to the projection view.
    3.  Click "Run Projection".
* **Expected Result:** A graph displaying the projected portfolio value over time is rendered. Calculation completes within the target timeframe (e.g., < 10 seconds)[cite: 67]. Graph loads reasonably quickly[cite: 68]. Visual representation appears logical based on inputs.
* **Priority:** High

* **Test Case ID:** TC-PROJ-002
* **Description:** Verify basic accuracy of projection calculation (manual check).
* **Steps:**
    1.  Create a very simple portfolio (e.g., 1 asset, fixed return, 1 contribution).
    2.  Run the projection.
    3.  Manually calculate the expected value for the first few time periods.
* **Expected Result:** The values shown on the graph roughly match the manual calculation, confirming basic logic is sound[cite: 76].
* **Priority:** High

---

**Feature:** Security (NFR - SEC-3[cite: 72], SEC-4 [cite: 73])

* **Test Case ID:** TC-SEC-001
* **Description:** Verify HTTPS is enforced.
* **Steps:**
    1.  Access the application URL in a browser.
    2.  Check the browser's address bar and security details.
* **Expected Result:** The connection uses HTTPS. A valid certificate is present[cite: 72]. No warnings about insecure connection.
* **Priority:** High

* **Test Case ID:** TC-SEC-002
* **Description:** Verify unauthorized access prevention.
* **Steps:**
    1.  Log out of the application.
    2.  Attempt to directly access URLs/API endpoints that require login (e.g., portfolio details page).
* **Expected Result:** User is redirected to the login page or receives an authorization error (e.g., 401/403). Portfolio data is not accessible[cite: 73].
* **Priority:** High

---

**Feature:** Usability (NFR - U-1[cite: 74], U-2 [cite: 75])

* **Test Case ID:** TC-USA-001
* **Description:** Verify clarity and efficiency of core workflow (Create Portfolio -> Add Asset -> Add Change -> Run Projection).
* **Steps:**
    1.  Perform the core workflow steps as a new user.
    2.  Observe clarity of instructions, ease of navigation, and number of clicks/steps required.
* **Expected Result:** Workflow is logical and efficient[cite: 75]. UI elements are clear and understandable[cite: 74]. No major points of confusion.
* **Priority:** High