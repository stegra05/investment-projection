# Functional Requirements (Updated - Multi-Panel & Guided Workflow Context)

## 1. Introduction

This document outlines the functional requirements for the Investment Planning Projection website, prioritized using MoSCoW. The core aim remains: *To provide personal finance planners and finance students with a simple, flexible web tool for visualizing long-term (3-40 year) investment projections, allowing detailed planning of future contributions/withdrawals and utilizing customizable projection models.*

Requirements are now contextualized within the adopted **hybrid multi-panel and guided workflow UI structure** for the frontend.

* **Must-have:** Critical for initial launch/core usability.
* **Should-have:** Important enhancements adding significant value.
* **Could-have:** Desirable features if time permits.
* **Won't-have (this time):** Explicitly out of scope.

## 2. Must-have Requirements

*(Features essential for the first operational version and core usability)*

* **M-1: Asset Selection (Core):** Users must be able to select core assets like Stocks and Bonds.
    * ***Frontend Location:*** **Implemented within the 'Assets View' of the Main Content Panel in the Portfolio Workspace.**
* **M-2: Allocation Specification:** Users must be able to specify the amount or weight of each selected asset.
    * ***Frontend Location:*** **Implemented within the 'Assets View' of the Main Content Panel.** *(See also M-UX1)*
* **M-3: Manual Expected Return Input:** Users must be able to manually input an expected rate of return for assets/components.
    * ***Frontend Location:*** **Implemented within the 'Assets View' of the Main Content Panel.**
* **M-4: Portfolio Management (CRUD):** Users must be able to create, view, edit, and delete portfolios.
    * ***Frontend Location:*** **Create initiated from 'Dashboard'. View/Switch handled via 'Navigation Panel'. Edit/Delete actions available via Navigation Panel or within an 'Overview/Settings View' in the Main Content Panel.**
* **M-5: Future Change Planning:** Users must be able to define and schedule future single changes (contributions, withdrawals, reallocations).
    * ***Frontend Location:*** **Implemented within a 'Planned Changes View' of the Main Content Panel.** *(See also SH-UX2 for recurring)*
* **M-6: Projection Visualization (Basic):** The system must calculate and display a visual graph of the projected portfolio value (deterministic model).
    * ***Frontend Location:*** **Inputs and visualization implemented within the dedicated 'Projection Panel' of the Portfolio Workspace.** *(See also SH-MC1, SH-MC3, SH-INF2 for enhancements. Consider a Guided Workflow for complex setup - see SH-GW1 below)*
* **M-7: User Registration & Login:** Users must be able to create an account and log in securely.
    * ***Frontend Location:*** **Handled via dedicated 'Login Page' and 'Registration Page'.**
* **M-8: Simple Interface:** The UI must be clean and logically structured.
    * ***Frontend Location:*** **Applies globally, supported by the multi-panel layout and potentially guided workflows.** *(Guided by M3 NFR)*
* **M-UX1 (Allocation Guidance):** The UI MUST clearly display total current allocation and remaining % needed while adjusting assets.
    * ***Frontend Location:*** **Implemented within the 'Assets View' of the Main Content Panel.**
* **M-UX2 (Allocation Error Msg):** Provide clear error message if allocations don't sum to 100% upon attempting to save/update.
    * ***Frontend Location:*** **Implemented within the 'Assets View' or via a dedicated allocation adjustment UI.**

## 3. Should-have Requirements

*(Important features or enhancements - locations adapted)*

* **S-1: Extended Asset Selection:** Users should be able to select more asset types.
    * *(Assets View)*
* **S-2: Asset Details Display:** The system should display basic details about selected assets.
    * *(Assets View, potentially expanding inline or in a sub-panel)*
* **S-3: Portfolio Summary View:** The system should provide a summary view of the current portfolio state.
    * *(Dedicated Navigation Panel section or Overview/Settings View in Main Content Panel)*
* **S-7: Password Management:** Secure password management features (reset).
    * *(Separate Settings/Profile page or flow)*
* **SH-MC1 (Monte Carlo Option):** Option to run Monte Carlo projections.
    * *(Projection Panel input)*
* **SH-MC2 (Volatility Input/Storage):** Select `asset_class`, optionally input `manual_volatility`.
    * *(Assets View)*
* **SH-MC3 (Monte Carlo Output):** Display MC results as probability bands.
    * *(Projection Panel chart)*
* **SH-MC4 (MC Backend/API):** Backend/API support for Monte Carlo.
    * *(Backend requirement)*
* **SH-INF1 (Inflation Input/Storage):** Specify and save default inflation rate.
    * *(Overview/Settings View or Projection Panel input)*
* **SH-INF2 (Inflation Calculation):** Optionally adjust projections for inflation.
    * *(Projection Panel calculation)*
* **SH-INF3 (Inflation API/Frontend):** API/FE support for inflation rate.
    * *(API/Projection Panel)*
* **SH-PV1 (Store Portfolio Value):** Store calculated total value persistently.
    * *(Backend/Database requirement, displayed in Navigation/Overview Panel)*
* **SH-UX1 (Projection Feedback):** Display informative status during projections.
    * *(Projection Panel)*
* **SH-UX2 (Recurring Changes):** Define recurring future changes.
    * *(Planned Changes View)*
* **SH-UX3 (Contextual Info):** Display relevant contextual info in change form.
    * *(Planned Changes View)*
* **SH-GW1 (Guided Projection Workflow):** The system SHOULD use a guided workflow (e.g., modal steps, dedicated workflow panel state) for configuring complex projections like Monte Carlo, breaking down parameter inputs logically. *(New - reflects accepted idea #3)*
    * ***Frontend Location:*** **Triggered from the 'Projection Panel'.**

## 4. Could-have Requirements

*(Desirable features - locations TBD or implied)*

* **S-4: Scenario Comparison:** Compare projections.
* **S-5: Portfolio Comparison:** Compare different saved portfolios.
* **S-6: Risk Visualization:** Visualize projection variability. *(Partially SH-MC3)*
* **C-1: Manual Transaction Entry:** Enter historical transactions.
* **C-2: Data Export:** Export portfolio/projection data.
* **C-3: Goal Setting:** Define financial goals.
* **C-4: Rebalancing Suggestions:** Suggest portfolio rebalancing.
* **CH-HD1 (Historical Data):** Integrate historical data.

## 5. Won't-have Requirements (This Time)

*(Explicitly out of scope)*

* Direct integration with brokerage accounts.
* Automated fetching of real-time market data.
* Automated transaction importing.
* Social features or sharing.
* **WH-T1 (Tax Page):** Dedicated tax modeling features.
* (Any other features not listed above)

---
*This updated document aligns functional requirements with the multi-panel workspace and incorporates the concept of guided workflows for specific tasks like complex projection setup (SH-GW1).*