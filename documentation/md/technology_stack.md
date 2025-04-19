# Technology Stack

## 1. Introduction

This document outlines the selected technology stack for the Investment Planning Projection website. These choices are based on the project's functional requirements (including complexity), non-functional requirements (especially maintainability), developer familiarity, budget constraints, and relevant knowledge base principles.

## 2. Core Technologies

* **Frontend Framework:** **React**
    * *Rationale:* Popular, component-based architecture supports maintainability and building complex UIs. Large community and ecosystem. User expressed preference.
* **Backend Framework:** **Flask (Python)**
    * *Rationale:* Leverages user's familiarity with Python. Python ecosystem is strong for potential numerical calculations. Flask's flexibility suits custom logic development.
* **Database:** **PostgreSQL**
    * *Rationale:* Robust relational database suitable for structured financial data (users, portfolios, plans). Enforces data integrity. Widely supported and has excellent free tiers available on hosting platforms, fitting the budget constraint. Works well with Python/SQLAlchemy.
* **Database Interaction (ORM):** **SQLAlchemy**
    * *Rationale:* Provides a Pythonic way to interact with PostgreSQL, significantly enhancing code readability and maintainability compared to raw SQL. Integrates well with Flask. User preferred this option.

## 3. Development & Workflow Tools

* **Version Control:** **Git / GitHub**
    * *Rationale:* Standard for version control. GitHub provides free private repositories, issue tracking, and collaboration features (useful even for solo projects for backup and history). Essential for code safety.
* **Task Tracking:** **Trello**
    * *Rationale:* Simple, visual Kanban board for managing tasks. Free tier is sufficient for solo use. User preferred this option.
* **Environment Management:** **Python Virtual Environments (`venv`)**
    * *Rationale:* Standard Python practice for isolating project dependencies, preventing conflicts.
* **Code Editor:** **Cursor** (User Specified)
    * *Rationale:* User's preferred editor, supports relevant languages.

## 4. Testing Frameworks (Planned)

* **Frontend Testing:** **Jest**
    * *Rationale:* Popular and well-integrated framework for testing React applications. User open to using it.
* **Backend Testing:** **Pytest**
    * *Rationale:* Powerful and popular testing framework for Python, generally preferred over built-in options. User open to using it.

## 5. Hosting & Deployment (Initial Considerations)

* **Hosting Platform:** To be finalized, but will prioritize platforms offering free tiers for Flask/Python applications and PostgreSQL databases (e.g., Render, Heroku - subject to free tier viability). Must fit within the €10/month budget constraint.
* **Data APIs:** May require sourcing external APIs for basic stock/bond information. Will prioritize free APIs or APIs with generous free tiers. Caching will be considered to manage usage limits.

---

*This stack provides a foundation balancing developer familiarity (Python), modern web practices (React), robust data storage (PostgreSQL), maintainability (SQLAlchemy), and budget constraints (prioritizing free tiers).*