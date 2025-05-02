# Test Plan & Test Cases (Updated)

## 1. Test Strategy

* **Scope:** Testing will primarily focus on the "Must-have" functional requirements defined in `functional_requirements.md` to ensure the core application is reliable. Key non-functional requirements (Security, Usability) will also be explicitly tested. Should-have features tested via exploratory testing if time permits.
* **Testing Types:**
    * **Unit Testing:** Backend (Flask) using **Pytest**[cite: 163]; Frontend (React) components/functions using **Jest**[cite: 162]. Focus on critical logic.
    * **Integration Testing:** Interaction between React frontend and Flask backend APIs; database interactions via backend.
    * **Manual Testing:** End-to-end tests simulating user workflows through the browser; essential for usability.
    * **Security Testing:** Basic checks (authentication, authorization, input validation, password hashing, HTTPS).
    * **Performance Testing (Basic):** Manual observation of calculation times and page/tab load speeds.
* **Tools:** Pytest, Jest, Web Browser Developer Tools.
* **Environment:** Primarily local development environment; final verification post-deployment.

## 2. Test Cases

*(Focus on Must-Have Features and Key NFRs)*

---

**Feature:** User Registration & Login (M-7, SEC-1, SEC-2)

* **Test Case ID:** TC-AUTH-001 - Verify successful registration. *(Steps unchanged)*
* **Test Case ID:** TC-AUTH-002 - Verify registration failure with existing email. *(Steps unchanged)*
* **Test Case ID:** TC-AUTH-003 - Verify successful login. *(Steps unchanged)*
* **Test Case ID:** TC-AUTH-004 - Verify login failure with invalid password. *(Steps unchanged)*
* **Test Case ID:** TC-AUTH-005 - Verify password hashing in the database. *(Steps unchanged)*

---

**Feature:** Portfolio Management (CRUD) (M-4)

* **Test Case ID:** TC-PORT-001 - Verify successful creation of a new portfolio. *(Steps potentially end with landing on Assets tab - see TC-USA-001)*
* **Test Case ID:** TC-PORT-002 - Verify viewing details of an existing portfolio *(Now within Portfolio Workspace tabs)*.
* **Test Case ID:** TC-PORT-003 - Verify successful editing of portfolio name/description *(Action likely within Portfolio Workspace header/overview)*.
* **Test Case ID:** TC-PORT-004 - Verify successful deletion of a portfolio *(Action likely from Dashboard or within Portfolio Workspace)*.

---

**Feature:** Asset & Allocation Management (M-1, M-2, M-UX1, M-UX2)

* **Test Case ID:** TC-ASSET-001
* **Description:** Verify adding a core asset (Stock/Bond) to a portfolio with allocation **within the Assets Tab**.
* **Steps:**
    1.  Log in and select a portfolio (navigates to Portfolio Workspace).
    2.  Navigate to the **Assets Tab**.
    3.  Click "Add Asset".
    4.  Select "Stock" or "Bond", specify details and allocation.
    5.  Verify allocation guidance (remaining %) is shown .
    6.  Save the asset.
    7.  *(Optional Error Test):* Try saving with allocation != 100% and verify error message .
* **Expected Result:** Asset is added to the list within the Assets Tab. Data saved. Guidance/errors work correctly.
* **Priority:** High

---

**Feature:** Future Change Planning (M-5)

* **Test Case ID:** TC-CHANGE-001
* **Description:** Verify adding a future change (e.g., contribution) to a portfolio **within the Planned Changes Tab**.
* **Steps:**
    1.  Log in and select a portfolio.
    2.  Navigate to the **Planned Changes Tab**.
    3.  Click "Add Change".
    4.  Define a change (type: contribution, amount: 500, date: future date).
    5.  Save the change.
* **Expected Result:** The planned change appears in the list on the Planned Changes Tab. Data saved.
* **Priority:** High

---

**Feature:** Projection Visualization (M-6, P-1, P-2, DA-1)

* **Test Case ID:** TC-PROJ-001
* **Description:** Verify successful generation and display of a projection graph **within the Projections Tab**.
* **Steps:**
    1.  Log in and select a portfolio with assets, changes, etc.
    2.  Navigate to the **Projections Tab**.
    3.  Enter parameters (dates, etc.).
    4.  Click "Run Projection".
* **Expected Result:** A graph is rendered within the Projections Tab. Calculation completes within target time[cite: 67]. Tab loads reasonably quickly[cite: 68]. Visual appears logical.
* **Priority:** High

* **Test Case ID:** TC-PROJ-002 - Verify basic accuracy of projection calculation (manual check). *(Steps unchanged, performed via Projections Tab)*

---

**Feature:** Security (NFR - SEC-3, SEC-4)

* **Test Case ID:** TC-SEC-001 - Verify HTTPS is enforced. *(Steps unchanged)*
* **Test Case ID:** TC-SEC-002 - Verify unauthorized access prevention *(Test accessing Portfolio Workspace URL directly)*.

---

**Feature:** Usability (NFR - U-1, U-2)

* **Test Case ID:** TC-USA-001 **(Updated Workflow)**
* **Description:** Verify clarity and efficiency of **refined core workflows**: 1) Onboarding & Initial Setup, 2) Managing Portfolio within Tabs.
* **Steps:**
    1.  **(Workflow 1 - Onboarding):**
        * Start as a new user, navigate to Register page.
        * Complete registration, proceed to Login.
        * Log in successfully, land on Dashboard.
        * Click "Create New Portfolio", fill details, Save.
        * **Verify landing on the 'Assets Tab' of the new Portfolio Workspace.**
        * Add an asset via the Assets Tab.
    2.  **(Workflow 2 - Portfolio Management):**
        * Log in, go to Dashboard, select the portfolio created above.
        * Verify landing in Portfolio Workspace (likely Overview Tab).
        * Navigate to **Assets Tab**, verify asset list, potentially edit allocation.
        * Navigate to **Planned Changes Tab**, add a future change.
        * Navigate to **Projections Tab**, enter parameters, run projection.
        * Observe clarity of navigation between tabs, ease of performing actions within each tab.
* **Expected Result:** Workflows are logical, efficient, and intuitive within the tabbed structure[cite: 75]. Navigation between pages and tabs is clear. UI elements within tabs are understandable[cite: 74]. No major points of confusion.
* **Priority:** High