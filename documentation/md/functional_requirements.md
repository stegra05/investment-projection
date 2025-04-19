# Functional Requirements

## 1. Introduction

This document outlines the functional requirements for the Investment Planning Projection website. Requirements are categorized using the MoSCoW method to prioritize development efforts and ensure the initial version focuses on core functionality. The MoSCoW method helps manage scope [cite: 5, 40] and deliver value quickly by differentiating between essential and non-essential features [cite: 13-15, 32, 43].

* **Must-have:** Critical features required for the initial launch.
* **Should-have:** Important features that add significant value but are not essential for the first version.
* **Could-have:** Desirable features that can be added if time and resources permit after launch.
* **Won't-have (this time):** Features explicitly excluded from the current scope.

## 2. Must-have Requirements

*(Features essential for the first operational version targeting intermediate/advanced users for future planning)*

* **M-1: Asset Selection (Core):** Users must be able to select core assets like Stocks and Bonds for their portfolio.
* **M-2: Allocation Specification:** Users must be able to specify the amount or weight of each selected asset in their portfolio.
* **M-3: Manual Expected Return Input:** Users must be able to manually input an expected rate of return for the assets or portfolio components.
* **M-4: Portfolio Management (CRUD):** Users must be able to create, view, edit, and delete investment portfolios.
* **M-5: Future Change Planning:** Users must be able to define and schedule future changes to their portfolio (e.g., contributions, withdrawals, reallocations) over a specified timeline.
* **M-6: Projection Visualization:** The system must calculate and display a visual representation (e.g., a graph) of the projected future value of the portfolio based on initial state, expected returns, and planned future changes.
* **M-7: User Registration & Login:** Users must be able to create an account and log in to save and access their portfolio data securely.
* **M-8: Password Management:** The system must provide secure password management features (e.g., password reset).
* **M-9: Simple Interface:** The user interface must be clean and logically structured, even for advanced features.

## 3. Should-have Requirements

*(Important features, but not critical for the initial launch)*

* **S-1: Extended Asset Selection:** Users should be able to select more complex or alternative asset types (e.g., Options, Cryptocurrencies).
* **S-2: Asset Details Display:** The system should display basic details about selected assets (e.g., ticker, name).
* **S-3: Portfolio Summary View:** The system should provide a summary view of the current portfolio state (e.g., total value, allocation chart).
* **S-4: Scenario Comparison:** Users should be able to create and visually compare projections based on different assumptions or strategies.
* **S-5: Portfolio Comparison:** Users should be able to visually compare the projections of different saved portfolios.
* **S-6: Risk Visualization:** The system should provide some visualization of potential projection variability or risk (e.g., displaying optimistic/pessimistic outcome ranges).

## 4. Could-have Requirements

*(Desirable features for future enhancements if time permits)*

* **C-1: Manual Transaction Entry:** Users could be able to enter historical transaction data (buys/sells) to establish a portfolio baseline.
* **C-2: Data Export:** Users could be able to export their portfolio or projection data (e.g., to CSV).
* **C-3: Goal Setting:** Users could be able to define specific financial goals and track projected progress towards them.
* **C-4: Rebalancing Suggestions:** The system could provide suggestions for portfolio rebalancing based on predefined rules or targets.

## 5. Won't-have Requirements (This Time)

*(Features explicitly out of scope for the initial version)*

* Direct integration with brokerage accounts.
* Automated fetching of real-time market data for projections (manual input or simplified assumptions for V1).
* Automated transaction importing.
* Social features or sharing capabilities.
* (Any other features not listed above are implicitly Won't-haves for the initial version).

---

*This document reflects the prioritized scope for the initial development phase. The focus will be on implementing the **Must-have** requirements to deliver a core functional product.*