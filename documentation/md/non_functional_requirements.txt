# Non-Functional Requirements (Updated)

## 1. Introduction

This document outlines the Non-Functional Requirements (NFRs) for the Investment Planning Projection website. NFRs define the quality attributes and constraints of the system, specifying *how well* it should perform its functions[cite: 8, 465]. They complement the Functional Requirements by setting standards for aspects like performance, security, usability, and maintainability[cite: 466]. These NFRs guide architectural and technological decisions[cite: 467].

## 2. Performance

* **P-1: Calculation Speed:**
    * *Basic Projections:* Deterministic projection calculations should complete within a reasonable timeframe (e.g., under 5-10 seconds)[cite: 468].
    * *Monte Carlo Projections:* Monte Carlo simulations may take longer but should still provide feedback (e.g., progress indication) and ideally complete within 30-60 seconds for a typical simulation run. Real-time performance is not critical. *(Note: Increased complexity from Monte Carlo requires careful performance management)*.
* **P-2: Load Speed:** Data visualizations (e.g., projection graphs) should load reasonably quickly upon request[cite: 469]. Immediate rendering is not required, but excessive delays should be avoided. Consider techniques like lazy loading or skeleton loaders.

## 3. Security

* **SEC-1: Authentication & Authorization:** Secure user registration and login mechanisms are required (Must-have Functional Requirement)[cite: 471]. Access to portfolio data must be restricted to the owner.
* **SEC-2: Password Security:** User passwords must be securely stored using strong hashing algorithms (e.g., bcrypt)[cite: 472]. Secure password reset functionality is required (Should-have Functional Requirement).
* **SEC-3: Data Transfer Security:** All communication between the client (browser) and server must be encrypted using HTTPS[cite: 473].
* **SEC-4: Data Protection (Baseline):** Standard security measures should prevent unauthorized access to user portfolio data[cite: 474]. Input validation must be implemented to prevent common web vulnerabilities (e.g., XSS, injection attacks).

## 4. Usability

* **U-1: Interface Clarity:** The user interface must have a clean design and be logically structured for ease of use, even for intermediate/advanced users navigating complex features[cite: 475].
* **U-2: Workflow Efficiency:** Workflows for key tasks (e.g., creating portfolios, adjusting allocations, defining changes, running projections) should be efficient and intuitive for the target user group[cite: 476].
* **U-3: Design System Alignment (Guideline):** The application frontend SHOULD adhere to Material Design 3 (M3) principles for visual design, interaction patterns, and accessibility to ensure clarity, consistency, and usability.
* **U-4: Animation Feedback (Guideline):** The application SHOULD incorporate subtle, performant animations to enhance interactive feedback (e.g., button presses, loading states), clarify state transitions (e.g., modal open/close), and improve perceived responsiveness.
* **U-5: Content & Microcopy:**
    * Labels MUST be clear and persistent; placeholders used only for hints.
    * Button labels MUST be action-oriented (e.g., "Add Asset," "Calculate Projection").
    * Error messages MUST be helpful, explaining the problem and how to fix it.
    * Tooltips SHOULD be used to explain complex or ambiguous fields concisely.
    * Empty states MUST provide guidance on the next step.
    * The overall tone MUST be professional, trustworthy, and encouraging, avoiding unnecessary jargon.

## 5. Data Accuracy

* **DA-1: Calculation Precision:** Financial calculations for projections (both deterministic and Monte Carlo) should be accurate and reliable for long-term planning purposes[cite: 477]. Use appropriate data types (e.g., Decimal) for financial values. Minor rounding differences may be acceptable if documented.
* **DA-2: Data Timeliness:** Underlying market data used for asset information or baseline assumptions does not need to be real-time[cite: 478]. Reasonably recent data suitable for long-term planning is sufficient.

## 6. Reliability

* **R-1: Availability:** High availability (e.g., 99.99% uptime) is not required[cite: 479]. Occasional downtime for maintenance or due to free-tier limitations is acceptable.
* **R-2: Recoverability:** The system should handle errors gracefully, and mechanisms should be in place for backup and potential recovery of user data (e.g., database backups)[cite: 480].

## 7. Maintainability

* **M-1: Modularity & Extensibility:** The system architecture (backend and frontend) must be designed in a modular way to facilitate future modifications and extensions[cite: 481]. *(Note: Adding complex features like Monte Carlo and recurring changes increases complexity; modular design becomes even more critical)*. Adherence to M3 principles should support frontend maintainability[cite: 482].
* **M-2: Code Readability:** Code should follow standard conventions for Python (Flask) and JavaScript (React) to ensure readability and ease of maintenance by a solo developer[cite: 483].
* **M-3: Configuration Management:** Configuration (e.g., database connections, API keys, default Monte Carlo parameters) should be managed outside the codebase (e.g., via environment variables or config files) for easier deployment and changes[cite: 484].

## 8. Constraints Compliance

* **C-1: Budget Adherence:** All technology choices (hosting, database, APIs) must align with the maximum budget of €10/month, prioritizing free tiers and open-source solutions[cite: 485].

---
*These NFRs provide the quality framework for development, balancing desired attributes like advanced projection capabilities and enhanced usability with the project's constraints.