# Functional Requirements (Updated)

## 1. Introduction

This document outlines the functional requirements for the Investment Planning Projection website. Requirements are categorized using the MoSCoW method to prioritize development efforts and ensure the initial version focuses on core functionality, while subsequent versions address important enhancements[cite: 436]. The refined aim is: *To provide personal finance planners and finance students with a simple, flexible web tool for visualizing long-term (3-40 year) investment projections, allowing detailed planning of future contributions/withdrawals and utilizing customizable projection models.*

The MoSCoW method helps manage scope [cite: 5, 40] and deliver value quickly by differentiating between essential and non-essential features.

* **Must-have:** Critical features required for the initial launch or core usability.
* **Should-have:** Important features or enhancements that add significant value.
* **Could-have:** Desirable features that can be added if time and resources permit.
* **Won't-have (this time):** Features explicitly excluded from the current scope.

## 2. Must-have Requirements

*(Features essential for the first operational version and core usability)*

* **M-1: Asset Selection (Core):** Users must be able to select core assets like Stocks and Bonds for their portfolio[cite: 442].
* **M-2: Allocation Specification:** Users must be able to specify the amount or weight of each selected asset in their portfolio[cite: 443]. *(See also M-UX1)*
* **M-3: Manual Expected Return Input:** Users must be able to manually input an expected rate of return for the assets or portfolio components[cite: 444].
* **M-4: Portfolio Management (CRUD):** Users must be able to create, view, edit, and delete investment portfolios[cite: 445].
* **M-5: Future Change Planning:** Users must be able to define and schedule future changes to their portfolio (e.g., single contributions, withdrawals, reallocations) over a specified timeline[cite: 446]. *(See also SH-UX2 for recurring)*
* **M-6: Projection Visualization (Basic):** The system must calculate and display a visual representation (e.g., a graph) of the projected future value of the portfolio based on initial state, expected returns, and planned future changes[cite: 447]. *(See also SH-MC1, SH-MC3, SH-INF2 for enhancements)*
* **M-7: User Registration & Login:** Users must be able to create an account and log in to save and access their portfolio data securely[cite: 448].
* **M-8: Simple Interface:** The user interface must be clean and logically structured, even for advanced features[cite: 449]. *(Guided by M3 NFR)*
* **M-UX1 (Allocation Guidance):** The UI MUST clearly display the total current allocation percentage and the remaining percentage needed to reach 100% while the user is adjusting asset allocations.
* **M-UX2 (Allocation Error Msg):** When saving allocations fails due to the total not equaling 100%, the system MUST provide a clear error message specifying the issue (e.g., "Total allocation is X%, must be 100%").

## 3. Should-have Requirements

*(Important features or enhancements for subsequent development cycles)*

* **S-1: Extended Asset Selection:** Users should be able to select more complex or alternative asset types (e.g., Options, Cryptocurrencies)[cite: 450].
* **S-2: Asset Details Display:** The system should display basic details about selected assets (e.g., ticker, name)[cite: 451].
* **S-3: Portfolio Summary View:** The system should provide a summary view of the current portfolio state (e.g., total value, allocation chart)[cite: 452].
* **S-7: Password Management:** The system should provide secure password management features (e.g., password reset)[cite: 456].
* **SH-MC1 (Monte Carlo Option):** The system SHOULD allow users to optionally run projections using a Monte Carlo simulation method based on asset expected return and volatility.
* **SH-MC2 (Volatility Input):** Users SHOULD be able to select an `asset_class` for each asset (implying default volatility lookup) AND optionally input a `manual_volatility` percentage to override the default.
* **SH-MC3 (Monte Carlo Output):** The projection chart SHOULD display Monte Carlo results as probability bands (e.g., 10th, 50th, 90th percentile).
* **SH-MC4 (MC Backend/API):** The backend and API MUST be updated to support Monte Carlo parameters, volatility inputs, perform simulations, and return percentile data.
* **SH-INF1 (Inflation Input/Storage):** Users SHOULD be able to specify and save a default average annual inflation rate within each portfolio's settings.
* **SH-INF2 (Inflation Calculation):** Projections SHOULD optionally adjust future values based on the specified inflation rate.
* **SH-INF3 (Inflation API/Frontend):** The API and Frontend MUST support setting/overriding the inflation rate for projections.
* **SH-PV1 (Store Portfolio Value):** The system SHOULD store the calculated total value of the portfolio persistently in the database, updating it when asset allocations change.
* **SH-UX1 (Projection Feedback):** The system SHOULD display informative status updates (e.g., "Fetching data...", "Calculating...", "Rendering...") when running a potentially long projection.
* **SH-UX2 (Recurring Changes):** The system SHOULD allow users to define recurring future changes (e.g., monthly contributions) with a start date, end date, and frequency.
* **SH-UX3 (Contextual Info):** When adding or editing a planned change, the form SHOULD display relevant contextual portfolio information (e.g., current total value).

## 4. Could-have Requirements

*(Desirable features for future enhancements if time permits)*

* **S-4: Scenario Comparison:** Users could be able to create and visually compare projections based on different assumptions or strategies[cite: 453].
* **S-5: Portfolio Comparison:** Users could be able to visually compare the projections of different saved portfolios[cite: 454].
* **S-6: Risk Visualization:** The system could provide some visualization of potential projection variability or risk (e.g., displaying optimistic/pessimistic outcome ranges)[cite: 455]. *(Partially addressed by SH-MC3)*
* **C-1: Manual Transaction Entry:** Users could be able to enter historical transaction data (buys/sells) to establish a portfolio baseline[cite: 457].
* **C-2: Data Export:** Users could be able to export their portfolio or projection data (e.g., to CSV)[cite: 458].
* **C-3: Goal Setting:** Users could be able to define specific financial goals and track projected progress towards them[cite: 459].
* **C-4: Rebalancing Suggestions:** The system could provide suggestions for portfolio rebalancing based on predefined rules or targets[cite: 460].
* **CH-HD1 (Historical Data):** The system COULD integrate historical data to suggest expected returns or volatilities for assets/classes.

## 5. Won't-have Requirements (This Time)

*(Features explicitly out of scope for the current/next version)*

* Direct integration with brokerage accounts[cite: 461].
* Automated fetching of real-time market data for projections (manual input or simplified assumptions for V1/V2)[cite: 462].
* Automated transaction importing[cite: 462].
* Social features or sharing capabilities[cite: 462].
* **WH-T1 (Tax Page):** A dedicated section/feature for modeling detailed tax implications on investments/projections.
* (Any other features not listed above are implicitly Won't-haves for the initial versions).

---
*This document reflects the prioritized scope, focusing on core functionality first, followed by key enhancements like advanced projections and usability refinements.*