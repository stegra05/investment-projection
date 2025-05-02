# Functional Requirements (Updated)

## 1. Introduction

This document outlines the functional requirements for the Investment Planning Projection website. Requirements are categorized using the MoSCoW method to prioritize development efforts[cite: 471]. The refined aim is: *To provide personal finance planners and finance students with a simple, flexible web tool for visualizing long-term (3-40 year) investment projections, allowing detailed planning of future contributions/withdrawals and utilizing customizable projection models.*

The MoSCoW method helps manage scope [cite: 5, 40, 472] and deliver value quickly by differentiating between essential and non-essential features:
* **Must-have:** Critical features required for the initial launch or core usability[cite: 473].
* **Should-have:** Important features or enhancements that add significant value[cite: 474].
* **Could-have:** Desirable features that can be added if time and resources permit[cite: 475].
* **Won't-have (this time):** Features explicitly excluded from the current scope[cite: 476].

## 2. Must-have Requirements

*(Features essential for the first operational version and core usability)*

* **M-1: Asset Selection (Core):** Users must be able to select core assets like Stocks and Bonds for their portfolio[cite: 477].
    * ***Frontend Location:*** **Implemented within the 'Assets Tab' of the Portfolio Workspace.**
* **M-2: Allocation Specification:** Users must be able to specify the amount or weight of each selected asset in their portfolio[cite: 478].
    * ***Frontend Location:*** **Implemented within the 'Assets Tab' of the Portfolio Workspace.** *(See also M-UX1)*
* **M-3: Manual Expected Return Input:** Users must be able to manually input an expected rate of return for the assets or portfolio components[cite: 479].
    * ***Frontend Location:*** **Implemented within the 'Assets Tab' of the Portfolio Workspace.**
* **M-4: Portfolio Management (CRUD):** Users must be able to create, view, edit, and delete investment portfolios[cite: 480].
    * ***Frontend Location:*** **Create initiated from 'Dashboard'. View/Edit/Delete managed via 'Dashboard' list actions and within the 'Portfolio Workspace' (e.g., editing name in header/overview, delete action).**
* **M-5: Future Change Planning:** Users must be able to define and schedule future changes to their portfolio (e.g., single contributions, withdrawals, reallocations) over a specified timeline[cite: 481].
    * ***Frontend Location:*** **Implemented within the 'Planned Changes Tab' of the Portfolio Workspace.** *(See also SH-UX2 for recurring)*
* **M-6: Projection Visualization (Basic):** The system must calculate and display a visual representation (e.g., a graph) of the projected future value of the portfolio based on initial state, expected returns, and planned future changes[cite: 482].
    * ***Frontend Location:*** **Inputs and visualization implemented within the 'Projections Tab' of the Portfolio Workspace.** *(See also SH-MC1, SH-MC3, SH-INF2 for enhancements)*
* **M-7: User Registration & Login:** Users must be able to create an account and log in to save and access their portfolio data securely[cite: 483].
    * ***Frontend Location:*** **Handled via dedicated 'Login Page' and 'Registration Page'.**
* **M-8: Simple Interface:** The user interface must be clean and logically structured, even for advanced features[cite: 484].
    * ***Frontend Location:*** **Applies globally, supported by the structured page layout (Dashboard, Portfolio Workspace with Tabs).** *(Guided by M3 NFR)*
* **M-UX1 (Allocation Guidance):** The UI MUST clearly display the total current allocation percentage and the remaining percentage needed to reach 100% while the user is adjusting asset allocations .
    * ***Frontend Location:*** **Implemented within the 'Assets Tab' of the Portfolio Workspace.**
* **M-UX2 (Allocation Error Msg):** When saving allocations fails due to the total not equaling 100%, the system MUST provide a clear error message specifying the issue (e.g., "Total allocation is X%, must be 100%") .
    * ***Frontend Location:*** **Implemented within the 'Assets Tab' of the Portfolio Workspace.**

## 3. Should-have Requirements

*(Important features or enhancements for subsequent development cycles - location implied by context)*

* **S-1: Extended Asset Selection:** Users should be able to select more complex or alternative asset types[cite: 487]. *(Assets Tab)*
* **S-2: Asset Details Display:** The system should display basic details about selected assets[cite: 488]. *(Assets Tab)*
* **S-3: Portfolio Summary View:** The system should provide a summary view of the current portfolio state[cite: 489]. *(Overview Tab)*
* **S-7: Password Management:** The system should provide secure password management features[cite: 490]. *(Likely separate Settings/Profile page or flow)*
* **SH-MC1 (Monte Carlo Option):** The system SHOULD allow users to optionally run projections using a Monte Carlo simulation method . *(Projections Tab)*
* **SH-MC2 (Volatility Input):** Users SHOULD be able to select an `asset_class` and optionally input `manual_volatility` . *(Assets Tab)*
* **SH-MC3 (Monte Carlo Output):** The projection chart SHOULD display Monte Carlo results as probability bands . *(Projections Tab)*
* **SH-MC4 (MC Backend/API):** Backend and API MUST support Monte Carlo . *(Backend requirement)*
* **SH-INF1 (Inflation Input/Storage):** Users SHOULD be able to specify and save a default average annual inflation rate . *(Portfolio Settings or Projections Tab)*
* **SH-INF2 (Inflation Calculation):** Projections SHOULD optionally adjust future values based on inflation . *(Projections Tab)*
* **SH-INF3 (Inflation API/Frontend):** API and Frontend MUST support inflation rate setting/overriding . *(Projections Tab / API)*
* **SH-PV1 (Store Portfolio Value):** The system SHOULD store the calculated total value persistently . *(Backend/Database requirement, displayed in Overview Tab)*
* **SH-UX1 (Projection Feedback):** The system SHOULD display informative status updates during projections . *(Projections Tab)*
* **SH-UX2 (Recurring Changes):** The system SHOULD allow users to define recurring future changes . *(Planned Changes Tab)*
* **SH-UX3 (Contextual Info):** The form for planned changes SHOULD display relevant contextual info . *(Planned Changes Tab)*

## 4. Could-have Requirements

*(Desirable features for future enhancements if time permits - locations TBD)*

* **S-4: Scenario Comparison:** Users could be able to create and visually compare projections[cite: 502].
* **S-5: Portfolio Comparison:** Users could be able to visually compare the projections of different saved portfolios[cite: 503].
* **S-6: Risk Visualization:** The system could provide some visualization of potential projection variability[cite: 504]. *(Partially addressed by SH-MC3)*
* **C-1: Manual Transaction Entry:** Users could be able to enter historical transaction data[cite: 505].
* **C-2: Data Export:** Users could be able to export their portfolio or projection data[cite: 506].
* **C-3: Goal Setting:** Users could be able to define specific financial goals[cite: 507].
* **C-4: Rebalancing Suggestions:** The system could provide suggestions for portfolio rebalancing[cite: 508].
* **CH-HD1 (Historical Data):** The system COULD integrate historical data to suggest returns or volatilities .

## 5. Won't-have Requirements (This Time)

*(Features explicitly out of scope for the current/next version)*

* Direct integration with brokerage accounts[cite: 510].
* Automated fetching of real-time market data for projections[cite: 511].
* Automated transaction importing[cite: 512].
* Social features or sharing capabilities[cite: 512].
* **WH-T1 (Tax Page):** A dedicated section/feature for modeling detailed tax implications .
* (Any other features not listed above are implicitly Won't-haves for the initial versions) .

---
*This updated document clarifies where the core functional requirements will be implemented within the proposed frontend structure.*