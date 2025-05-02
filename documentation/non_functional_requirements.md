# Non-Functional Requirements (Updated - Multi-Panel & Guided Workflow Context)

## 1. Introduction

This document outlines the Non-Functional Requirements (NFRs) for the Investment Planning Projection website. NFRs define the quality attributes and constraints, specifying *how well* the system performs functions like performance, security, usability, and maintainability. These requirements are updated to reflect the adoption of a **hybrid multi-panel layout and guided workflow** structure for the frontend, using a **Data-Focused Flat 2.0 aesthetic**, **purposeful animation**, and **clear, professional content**.

## 2. Performance

* **P-1: Calculation Speed:**
    * *Basic Projections:* Backend deterministic calculations target < 5-10 seconds.
    * *Monte Carlo Projections:* Backend simulations target < 30-60 seconds, with frontend feedback (SH-UX1). Real-time not required.
* **P-2: Load Speed & Responsiveness (Frontend):**
    * **Priority: High.** Initial application load speed target < 3-5s.
    * **Interaction Responsiveness:** UI interactions within panels (e.g., opening editors, switching views within the Main Content Panel) and transitions between guided workflow steps MUST feel responsive and immediate. Subtle, performant animations are key here.
    * **Panel Updates:** Updates propagating between panels (e.g., changing an asset affecting the projection panel) should occur without noticeable lag.
    * **Mitigation:** Aggressively implement frontend performance best practices: **code-splitting** (potentially per panel/route), **lazy-loading** non-critical panels or heavy components (like Recharts), efficient state management (Zustand/Context/Local), memoization (React.memo), optimizing component re-renders, and ensuring **animations prioritize transform/opacity**. Monitor JavaScript bundle size and execution time. *(Updated Emphasis)*

## 3. Security

* **SEC-1: Authentication & Authorization:** Secure backend auth; portfolio access restricted to owner.
* **SEC-2: Password Security:** Strong backend password hashing (bcrypt); secure reset (Should-have).
* **SEC-3: Data Transfer Security:** HTTPS MUST be used for all client-server communication.
* **SEC-4: Data Protection & Input Validation:**
    * Standard backend protections (XSS, injection).
    * Basic client-side validation recommended for UX (using clear microcopy).
    * **All critical security and data integrity validation MUST occur on the backend.** *(Unchanged)*

## 4. Usability

* **U-1: Interface Clarity:**
    * **Multi-Panel:** Achieved through clear visual separation (Flat 2.0 styling), strong internal hierarchy (typography, spacing), and consistent information display.
    * **Guided Workflows:** Achieved by breaking complex tasks into logical, focused steps with clear instructions (professional, guiding tone).
    * **High Priority.**
* **U-2: Workflow Efficiency:**
    * **Multi-Panel:** Aims for high efficiency for expert users on larger screens by providing simultaneous access to related information and controls.
    * **Guided Workflows:** Optimizes efficiency for specific, complex, multi-step tasks.
    * **Mobile Adaptation:** Designing an efficient and intuitive experience on smaller screens where panels likely need to stack or collapse is a **critical usability challenge** requiring careful design and testing.
    * **High Priority.**
* **U-3: Design System Alignment (Guideline):** M3 principles guide component styling/accessibility where appropriate, but the overall application layout (multi-panel) and primary aesthetic follow the custom **Data-Focused Flat 2.0** direction.
* **U-4: Animation Feedback (Guideline):** Incorporate **subtle, performant, purposeful animations** (approved concepts) for feedback within panels, transitions between workflow steps, indicating loading states, and clarifying relationships. Performance is paramount.
* **U-5: Content & Microcopy:** **Clear, Professional, Guiding** tone implemented via meticulous microcopy (labels, buttons, errors, tooltips, empty states) is **High Priority** for overall usability and trust.

## 5. Data Accuracy

* **DA-1: Calculation Precision:** Backend uses appropriate types (Decimal).
* **Frontend Display:** **High Priority.** Frontend accurately displays financial data consistently (standardized decimal places, clear formatting).
* **DA-2: Data Timeliness:** Real-time data not required.

## 6. Reliability

* **R-1: Availability:** High availability not required; occasional downtime acceptable.
* **R-2: Recoverability:** Standard DB backups; frontend state loss on refresh acceptable (refetch data).

## 7. Maintainability

* **M-1: Modularity & Extensibility:**
    * Backend/frontend separation maintained.
    * **Frontend Structure:** Modular component structure (by feature/panel/workflow) is **essential** for managing the complexity of the multi-panel layout and state interactions. Linters/formatters (ESLint/Prettier) enforced. *(Updated Emphasis)*
* **M-2: Code Readability:** Follow standard conventions; linters assist; clear naming conventions for components, state, and styles.
* **M-3: Configuration Management:** Managed via env vars/config files.

## 8. Constraints Compliance

* **C-1: Budget Adherence:** Tech choices align with max €10/month budget (free tiers/open-source). **Strict Constraint.**

---
*This updated NFR document integrates considerations related to the multi-panel UI, guided workflows, Flat 2.0 aesthetic, animation strategy, and content principles, highlighting key areas like performance optimization, mobile adaptation, and the critical role of clear microcopy.*