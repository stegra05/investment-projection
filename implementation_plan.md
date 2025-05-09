## Planned Changes Feature: Implementation Plan

This plan outlines the steps to implement the "Planned Changes" feature, incorporating a timeline view with a synchronized detail list, and a slide-in panel for adding/editing changes, including recurrence and reallocation logic.

---

### Phase 1: Backend Modifications

**Objective:** Update the backend to support detailed planned changes, including recurrence rules and ensure the projection engine can process them.

* **Task 1.1: Enhance `PlannedFutureChange` Model & Enum**
    * [x] **Action:** Add fields for recurrence to the `PlannedFutureChange` model.
        * `is_recurring` (Boolean, default False)
        * `frequency` (Enum: `ONE_TIME`, `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`; default `ONE_TIME`)
        * `interval` (Integer, default 1)
        * `days_of_week` (JSON or Array of integers [0-6 for Mon-Sun], nullable)
        * `day_of_month` (Integer [1-31], nullable)
        * `month_ordinal` (Enum: `FIRST`, `SECOND`, `THIRD`, `FOURTH`, `LAST`, nullable)
        * `month_ordinal_day` (Enum: `MONDAY`, ..., `SUNDAY`, `DAY`, `WEEKDAY`, `WEEKEND_DAY`, nullable)
        * `month_of_year` (Integer [1-12], nullable, for yearly)
        * `ends_on_type` (Enum: `NEVER`, `AFTER_OCCURRENCES`, `ON_DATE`, default `NEVER` if recurring)
        * `ends_on_occurrences` (Integer, nullable)
        * `ends_on_date` (Date, nullable)
    * [x] **Action:** Create new Enums in `app/enums.py` for `FrequencyType`, `MonthOrdinalType`, `OrdinalDayType`, `EndsOnType` if not using simple strings.
    * **File(s):**
        * `backend/app/models/planned_future_change.py`
        * `backend/app/enums.py`
    * **Cursor Instruction:** "Update the `PlannedFutureChange` model in `backend/app/models/planned_future_change.py` to include the new fields for recurrence as specified. Also, define any necessary new Enums in `backend/app/enums.py`."

* **Task 1.2: Update Database Schema (Migrations)**
    * [x] **Action:** Generate and apply a new database migration to reflect the model changes.
    * **Command (example):** `flask db migrate -m "Add recurrence fields to PlannedFutureChange"` then `flask db upgrade`
    * **File(s):** (New migration file will be generated in `backend/migrations/versions/`)
    * **Cursor Instruction:** "After updating the model, generate a Flask-Migrate revision by running `flask db migrate -m "Add recurrence fields to PlannedFutureChange"` in the backend terminal, then apply it with `flask db upgrade`."

* **Task 1.3: Update Pydantic Schemas for Planned Changes**
    * [x] **Action:** Add the new recurrence fields to `PlannedChangeBase`, `PlannedChangeCreateSchema`, and `PlannedChangeUpdateSchema`. Ensure they are optional where appropriate, especially in `PlannedChangeUpdateSchema`.
    * [x] **Action:** Ensure `target_allocation_json` is correctly handled in these schemas (it seems to be already present in the model).
    * **File(s):** `backend/app/schemas/portfolio_schemas.py`
    * **Cursor Instruction:** "In `backend/app/schemas/portfolio_schemas.py`, update `PlannedChangeBase`, `PlannedChangeCreateSchema`, and `PlannedChangeUpdateSchema` to include all the new recurrence fields. Make them optional in the update schema."

* **Task 1.4: Modify API Routes for Planned Changes**
    * [x] **Action:** Update the `POST` and `PUT/PATCH` routes in `changes.py` to accept and process the new recurrence fields from the `validated_data`.
    * [x] **Action:** Ensure the `target_allocation_json` is correctly processed for "Reallocation" type changes (this seems to be handled by Pydantic validation already regarding `amount` field).
    * **File(s):** `backend/app/routes/changes.py`
    * **Cursor Instruction:** "Modify the `add_planned_change` and `update_planned_change` functions in `backend/app/routes/changes.py` to correctly handle the new recurrence fields and `target_allocation_json` from the validated Pydantic schemas when creating/updating `PlannedFutureChange` objects."

* **Task 1.5: Enhance Projection Engine for Recurring Changes**
    * [x] **Action:** Modify `_fetch_and_prepare_data` or a new function within `projection_engine.py` to expand recurring `PlannedFutureChange` objects into a series of single change instances for the projection period.
        * This involves interpreting the `frequency`, `interval`, `days_of_week`, `ends_on_type`, etc.
        * Consider using `dateutil.rrule` for complex recurrence logic.
    * [x] **Action:** Ensure the main `calculate_projection` loop correctly uses these expanded instances.
    * **File(s):** `backend/app/services/projection_engine.py`
    * **Cursor Instruction:** "Update `backend/app/services/projection_engine.py`. In the logic that prepares planned changes (e.g., `_fetch_and_prepare_data`), add functionality to expand recurring changes based on their rules (frequency, interval, end conditions) into individual instances that fall within the projection's start and end dates. The `_calculate_net_monthly_change` function should then process these expanded instances."

* **Task 1.6: (Optional but Recommended) API Endpoint for Projection Preview**
    * [x] **Action:** Create a new API endpoint, e.g., `POST /api/v1/portfolios/{portfolio_id}/projections/preview`.
    * [x] **Action:** This endpoint should accept the standard projection parameters *plus* a temporary list of planned changes (including a potentially new/modified one). It runs the projection with this temporary data *without* saving the changes to the database and returns the projection result.
    * **File(s):**
        * `backend/app/routes/projections.py` (new route)
        * `backend/app/services/projection_engine.py` (may need slight adaptation to accept changes directly)
    * **Cursor Instruction:** "In `backend/app/routes/projections.py`, add a new route `POST /api/v1/portfolios/{portfolio_id}/projections/preview`. This route should accept projection parameters and a list of planned changes (including temporary ones). It should use the `projection_engine.py` to calculate a projection based on this temporary data without saving anything permanently. The projection engine might need a slight modification to accept an explicit list of changes as an argument."

---

### Phase 2: Frontend Implementation - `ChangesView` Core

**Objective:** Set up the main view for planned changes, fetch and display data, and implement the slide-in panel for adding/editing.

* **Task 2.1: Create `ChangesView.js` Component Structure**
    * [x] **Action:** Replace the placeholder `ChangesView` in `MainContentPanel.js` with a proper component structure.
    * [x] **Action:** Create a new file `frontend/src/features/portfolio/views/ChangesView.js`.
    * [x] **Action:** Implement the basic layout as per the HTML concept: header with "Add New Change" button, filter section, and placeholders for timeline and details list.
    * **File(s):**
        * `frontend/src/features/portfolio/panels/MainContentPanel.js` (update import)
        * `frontend/src/features/portfolio/views/ChangesView.js` (new)
    * **Cursor Instruction:** "Create the file `frontend/src/features/portfolio/views/ChangesView.js`. Implement the basic component structure with a header, an 'Add New Change' button, a section for filters, and placeholders for the timeline and change details list. Then, update `frontend/src/features/portfolio/panels/MainContentPanel.js` to import and render this new `ChangesView` instead of the placeholder."

* **Task 2.2: API Service for Planned Changes**
    * [x] **Action:** Add functions to `portfolioService.js` to:
        * Fetch planned changes for a portfolio (e.g., `getPlannedChanges(portfolioId, params)` where params could include date range for timeline expansion).
        * Add a new planned change (`addPlannedChange(portfolioId, changeData)`).
        * Update an existing planned change (`updatePlannedChange(portfolioId, changeId, changeData)`).
        * Delete a planned change (`deletePlannedChange(portfolioId, changeId)`).
    * [x] **Action:** (If Task 1.6 done) Add a service function for `previewProjection(portfolioId, projectionParams, draftChanges)`.
    * **File(s):** `frontend/src/api/portfolioService.js`
    * **Cursor Instruction:** "In `frontend/src/api/portfolioService.js`, add new methods: `getPlannedChanges(portfolioId, queryParams)`, `addPlannedChange(portfolioId, changeData)`, `updatePlannedChange(portfolioId, changeId, changeData)`, and `deletePlannedChange(portfolioId, changeId)`. These should call the corresponding backend API endpoints. If the preview projection endpoint was added to the backend, also add a `previewProjection` service method."

* **Task 2.3: State Management for Planned Changes**
    * [x] **Action:** In `ChangesView.js`, use `useState` to manage:
        * `plannedChanges` (array)
        * `isLoading`, `error`
        * `filters` (object)
        * `selectedChangeId` (string/null)
    * [x] **Action:** Use `useEffect` to fetch planned changes when the component mounts or `portfolioId` (from `usePortfolio` context) changes. Utilize the `refreshPortfolio` from `usePortfolio` context if planned changes are part of the main portfolio object fetched by the context, or fetch them separately.
        * *Decision Point:* Are planned changes part of the `portfolio` object from `PortfolioContext` (like `portfolio.assets`) or fetched separately? The current `PortfolioSchema` includes `planned_changes` [cite: stegra05/investment-projection/investment-projection-2bd3b107fd781d7ef2806c6f57559beba89614e2/backend/app/schemas/portfolio_schemas.py], so they should be available via `portfolio.planned_changes` from `usePortfolio()`.
    * **File(s):** `frontend/src/features/portfolio/views/ChangesView.js`
    * **Cursor Instruction:** "In `ChangesView.js`, set up state for `plannedChanges`, `isLoading`, `error`, `filters`, and `selectedChangeId`. Use the `usePortfolio` hook to get the current `portfolio` object. The `portfolio.planned_changes` array should contain the data. Implement `useEffect` to update the local `plannedChanges` state when `portfolio.planned_changes` changes. Handle loading and error states."

* **Task 2.4: Implement Basic Filters**
    * [x] **Action:** In `ChangesView.js`, create controlled components for filters (Type, Start Date, End Date, Description Search).
    * [x] **Action:** Implement logic to filter the displayed `plannedChanges` based on active filter values.
    * **File(s):** `frontend/src/features/portfolio/views/ChangesView.js`
    * **Cursor Instruction:** "In `ChangesView.js`, implement the filter input fields (Change Type select, Start/End Date inputs, Description text input). Add state and logic to filter the `plannedChanges` array based on the values entered in these filters and re-render the list/timeline accordingly."

* **Task 2.5: Display Planned Changes (Detail List/Cards)**
    * [x] **Action:** Create a `ChangeItemCard.js` component (or similar) to render individual planned changes.
    * [x] **Action:** In `ChangesView.js`, map over the (filtered) `plannedChanges` and render `ChangeItemCard` for each.
    * [x] **Action:** Style the cards according to the HTML concept (type icon, date, amount, description, edit/delete buttons).
    * **File(s):**
        * `frontend/src/features/portfolio/views/ChangesView.js`
        * `frontend/src/features/portfolio/components/ChangeItemCard.js` (new)
    * **Cursor Instruction:** "Create a new component `frontend/src/features/portfolio/components/ChangeItemCard.js`. This component should accept a `change` object as a prop and render its details (type, date, amount, description, recurrence info) with edit and delete buttons, styled like the concept. In `ChangesView.js`, map the filtered planned changes to render these cards."

---

### Phase 3: Frontend Implementation - Timeline View

**Objective:** Implement the interactive timeline and synchronize it with the detail list.

* **Task 3.1: Create Timeline Component**
    * [x] **Action:** Create a `TimelineView.js` component. This could be a simple vertical list grouped by year/month initially.
    * [x] **Action:** Pass the (filtered) `plannedChanges` and `selectedChangeId` as props.
    * [x] **Action:** Render timeline markers for each change, styled with icons/colors based on `change.type`.
    * **File(s):**
        * `frontend/src/features/portfolio/views/ChangesView.js` (integrate `TimelineView`)
        * `frontend/src/features/portfolio/components/TimelineView.js` (new)
    * **Cursor Instruction:** "Create `frontend/src/features/portfolio/components/TimelineView.js`. This component should take `plannedChanges` and `selectedChangeId` as props. Render a vertical list of changes, grouped by year, showing a small marker/icon and brief info for each. Highlight the marker if its ID matches `selectedChangeId`. Integrate this into `ChangesView.js`."

* **Task 3.2: Implement Timeline-List Synchronization**
    * [x] **Action:** In `ChangesView.js`, create a `handleSelectChange(changeId)` function that updates `selectedChangeId`.
    * [x] **Action:** Pass this function to `TimelineView.js` and `ChangeItemCard.js`.
    * [x] **Action:** When a timeline marker is clicked, call `handleSelectChange`.
    * [x] **Action:** When a change card is clicked, call `handleSelectChange`. (Covered by ChangesView.js modifications, assuming ChangeItemCard is set up)
    * [x] **Action:** Ensure the selected item is visually highlighted in both the timeline and the list. (Timeline done, List relies on ChangeItemCard implementation)
    * [x] **Action:** Implement `scrollIntoView` for the selected item in both views. (Done for details list in ChangesView.js; timeline item scroll TBD if needed)
    * **File(s):**
        * `frontend/src/features/portfolio/views/ChangesView.js`
        * `frontend/src/features/portfolio/components/TimelineView.js`
        * `frontend/src/features/portfolio/components/ChangeItemCard.js`
    * **Cursor Instruction:** "In `ChangesView.js`, implement `handleSelectChange(changeId)` to update the `selectedChangeId` state. Pass this function to `TimelineView` and `ChangeItemCard`. On click, these components should call `handleSelectChange`. Ensure the selected item is visually distinct (e.g., border, background) in both views and scrolls into view."

---

### Phase 4: Frontend Implementation - Slide-In Panel & Form

**Objective:** Implement the form for adding and editing planned changes, including conditional logic for type and recurrence.

* **Task 4.1: Create `AddEditChangePanel.js` Component**
    * [ ] **Action:** Create the file `frontend/src/features/portfolio/components/AddEditChangePanel.js`.
    * [ ] **Action:** Implement the panel structure (header, close button, form) and slide-in/out animation (CSS transform and transition).
    * [ ] **Action:** Manage panel visibility state (`isPanelOpen`, `editingChangeData`) in `ChangesView.js` and pass props to the panel.
    * **File(s):**
        * `frontend/src/features/portfolio/views/ChangesView.js`
        * `frontend/src/features/portfolio/components/AddEditChangePanel.js` (new)
    * **Cursor Instruction:** "Create `frontend/src/features/portfolio/components/AddEditChangePanel.js`. Implement it as a slide-in panel (from the right) containing a form. In `ChangesView.js`, manage state for `isPanelOpen` and `editingChangeData` (to pass to the panel when editing). Add functions to open/close the panel."

* **Task 4.2: Implement Core Form Fields in Panel**
    * [ ] **Action:** In `AddEditChangePanel.js`, add basic form fields: `changeType` (Select), `changeDate` (Date input), `changeAmount` (Number input, conditional), `description` (Textarea).
    * [ ] **Action:** Use shared `Input.js`, `Select.js`, `Button.js` components.
    * [ ] **Action:** Implement state within the panel to manage form data.
    * [ ] **Action:** Populate form if `editingChangeData` is passed.
    * **File(s):** `frontend/src/features/portfolio/components/AddEditChangePanel.js`
    * **Cursor Instruction:** "In `AddEditChangePanel.js`, build the form with fields for Change Type (select), Date, Amount (number), and Description (textarea), using your existing `Input`, `Select` components. Manage form data using local state. If `editingChangeData` prop is provided, pre-fill the form."

* **Task 4.3: Conditional Logic for Change Type (Amount & Reallocation)**
    * [ ] **Action:** In `AddEditChangePanel.js`, show/hide the "Amount" field based on `changeType`.
    * [ ] **Action:** Implement the "Reallocation" section:
        * Show when `changeType` is "Reallocation".
        * Fetch/display current portfolio assets (from `usePortfolio()` context or passed as prop).
        * Allow input of new target percentages for each asset.
        * Display running total and validate sum to 100%.
        * Provide contextual info (current asset percentages).
    * **File(s):** `frontend/src/features/portfolio/components/AddEditChangePanel.js`
    * **Cursor Instruction:** "In `AddEditChangePanel.js`, add logic: 1. Show 'Amount' field only if Change Type is 'Contribution' or 'Withdrawal'. 2. If Change Type is 'Reallocation', hide 'Amount' and show a new section. This section should list current portfolio assets (fetch via `usePortfolio` or pass as prop) with input fields for new target percentages. Display the sum of these new percentages and validate it sums to 100%."

* **Task 4.4: Implement Recurrence Rule Section in Form**
    * [ ] **Action:** In `AddEditChangePanel.js`, add a checkbox "This is a recurring change."
    * [ ] **Action:** When checked, reveal a "Recurrence Rules" section.
    * [ ] **Action:** Implement fields for `frequency`, `interval`, `days_of_week` (conditional for weekly), `day_of_month`