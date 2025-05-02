# Non-Functional Requirements (Updated)

## 1. Introduction

This document outlines the Non-Functional Requirements (NFRs) for the Investment Planning Projection website. NFRs define the quality attributes and constraints of the system, specifying *how well* it should perform its functions[cite: 8, 465, 842]. They complement the Functional Requirements by setting standards for aspects like performance, security, usability, and maintainability[cite: 466], guiding architectural and technological decisions[cite: 467].

## 2. Performance

* **P-1: Calculation Speed:**
    * *Basic Projections:* Deterministic projection calculations (backend) should complete within a reasonable timeframe (e.g., under 5-10 seconds) .
    * *Monte Carlo Projections:* Monte Carlo simulations (backend) may take longer but should provide feedback (SH-UX1) and ideally complete within 30-60 seconds . Real-time performance is not critical .
* **P-2: Load Speed (Frontend):**
    * **Priority: Moderately High.** Initial application load speed should be reasonably fast (target < 3-5s) to provide a professional user experience[cite: 8, 842].
    * **Tab/View Switching:** Navigation between tabs/views within the Portfolio Workspace should also be responsive to avoid disrupting user workflow.
    * **Suggestion:** Implement frontend performance best practices like **code-splitting** per route/tab and **lazy-loading** heavy components (e.g., charts) . *(Updated Section)*

## 3. Security

* **SEC-1: Authentication & Authorization:** Secure user registration and login (backend); access restricted to owner .
* **SEC-2: Password Security:** Passwords securely hashed using strong algorithms (e.g., bcrypt) on the backend . Secure password reset (Should-have).
* **SEC-3: Data Transfer Security:** All client-server communication MUST use HTTPS .
* **SEC-4: Data Protection & Input Validation:**
    * Standard backend security measures against common vulnerabilities (XSS, injection) required .
    * **Frontend Input Validation: Basic client-side validation (e.g., checking for empty required fields, basic formats) is recommended** for better UX and reduced invalid API calls.
    * **Crucially, all critical security and data integrity validation MUST be performed on the backend (Flask)**, as client-side checks are insufficient alone . *(Updated Section)*

## 4. Usability

* **U-1: Interface Clarity:** Clean design, logically structured (supported by tabbed workspace) . **High Priority.**
* **U-2: Workflow Efficiency:** Key tasks (portfolio creation, asset management, running projections) should be intuitive and efficient . **High Priority.**
* **U-3: Design System Alignment (Guideline):** Adherence to Material Design 3 (M3) principles is a **strong guideline** for visual design, interaction patterns, and accessibility . Strict adherence is secondary to core usability if conflicts arise under constraints. *(Updated specification)*
* **U-4: Animation Feedback (Guideline):** Incorporate **subtle, performant, and purposeful animations** to enhance interactive feedback and state transitions. Avoid complex or purely decorative animations . *(Updated specification)*
* **U-5: Content & Microcopy:** Clear labels, action-oriented buttons, helpful errors, concise tooltips, guided empty states, professional tone are required . **High Priority.**

## 5. Data Accuracy

* **DA-1: Calculation Precision:** Backend financial calculations must be accurate and reliable . Use appropriate data types (Decimal).
* **Frontend Display:** **High Priority.** The frontend must display financial data accurately and consistently (e.g., standardizing decimal places for currency and percentages) . *(New specification)*
* **DA-2: Data Timeliness:** Real-time market data is not required .

## 6. Reliability

* **R-1: Availability:** High availability (99.99%) is not required. Acceptable tolerance for occasional downtime .
* **R-2: Recoverability:** Standard database backup mechanisms should be in place . Frontend state loss on refresh is acceptable if data is refetched.

## 7. Maintainability

* **M-1: Modularity & Extensibility:** System architecture (backend/frontend) must be modular .
    * **Frontend Structure:** The tabbed structure and component-based nature of React support this.
    * **Suggestion:** Adopt a **consistent folder structure** (e.g., by feature/tab) and use **linters/formatters** (ESLint/Prettier) for React code. *(New suggestion)*
* **M-2: Code Readability:** Code should follow standard conventions (Python/Flask, JavaScript/React) . Consistent styling via linters helps.
* **M-3: Configuration Management:** Configuration managed outside codebase (env vars, config files) .

## 8. Constraints Compliance

* **C-1: Budget Adherence:** Technology choices must align with max €10/month budget, prioritizing free tiers/open-source . **Strict Constraint.**

---
*This updated NFR document incorporates the specific priorities and suggestions for the frontend.*