# Implementation Plan: Finish Requirement M-1 (Asset Selection - Core)

**Objective:** Implement the frontend functionality within the `AssetsView` component to allow users to select and add core assets (like Stocks, Bonds) to their portfolio, integrating with the existing backend API.

**Relevant Files:**

* `frontend/src/features/portfolio/panels/MainContentPanel.js`
* `frontend/src/features/portfolio/views/AssetsView.js` (Will be created/modified)
* `frontend/src/components/Input/Input.js`
* `frontend/src/components/Select/Select.js` (Will be created)
* `frontend/src/components/Button/Button.js`
* `frontend/src/api/portfolioService.js`
* `frontend/src/features/portfolio/state/PortfolioContext.js`
* `frontend/src/config/api.js`
* `backend/app/enums.py` (Reference for AssetType values)

---

**Subtasks:**

1.  **Update API Configuration:**
    * **File:** `frontend/src/config/api.js`
    * **Action:** Add the specific endpoint path for adding an asset to a portfolio within the `ENDPOINTS.PORTFOLIO` object. It should likely accept a `portfolioId`. Example: `ADD_ASSET: (portfolioId) => \`${API_BASE_URL}/portfolios/${portfolioId}/assets\``.

2.  **Create `portfolioService` Function:**
    * **File:** `frontend/src/api/portfolioService.js`
    * **Action:** Implement a new async function `addAssetToPortfolio(portfolioId, assetData)` that sends a `POST` request to the endpoint defined in Task 1, passing the `assetData` (containing type, name, allocation, etc.) in the request body. Include basic error handling (try/catch, log errors, re-throw or return error details).

3.  **Create/Replace `AssetsView` Component:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js`
    * **Action:** Create this file if it doesn't exist or replace the placeholder content. Import necessary hooks (`React`, `useState`, `usePortfolio`). Define the basic component structure.
    * **File:** `frontend/src/features/portfolio/panels/MainContentPanel.js`
    * **Action:** Update the import and usage of `AssetsView` to point to the actual component created above, removing the placeholder definition.

4.  **Fetch and Display Existing Assets:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js`
    * **Action:** Use the `usePortfolio` hook to get the `portfolio` object from the context. If `portfolio` and `portfolio.assets` exist, map over the `portfolio.assets` array and render a simple list or table displaying key details of each existing asset (e.g., `name_or_ticker`, `asset_type`, `allocation_percentage`/`value`). Handle loading and empty states.

5.  **Create Reusable `Select` Component:**
    * **File:** `frontend/src/components/Select/Select.js` (Create this file and directory if needed)
    * **Action:** Create a reusable `Select` component that accepts `label`, `id`, `name`, `value`, `onChange`, `options` (an array of `{ value: string, label: string }`), `required`, `disabled` props. It should render an HTML `<select>` element with the provided options. Apply basic Tailwind styling similar to the `Input` component.
    * **Note:** Get the `AssetType` enum values from `backend/app/enums.py` to populate the options for the asset type selector.

6.  **Build "Add Asset" Form:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js`
    * **Action:** Add an HTML `<form>` element within the `AssetsView` component. Include the following input fields using the reusable `Input` and `Select` components:
        * `Select` component for `asset_type` (options based on `AssetType` enum).
        * `Input` component for `name_or_ticker`.
        * `Input` component (type number) for `allocation_percentage` OR `allocation_value` (consider how to handle exclusivity - maybe start with just percentage).
        * `Input` component (type number) for `manual_expected_return` (optional).
        * A submit `Button`.

7.  **Implement Form State:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js`
    * **Action:** Use `useState` hooks to manage the state for each field in the "Add Asset" form (e.g., `const [assetType, setAssetType] = useState('');`). Create corresponding `onChange` handlers for each input to update the state.

8.  **Implement Form Submission Logic:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js`
    * **Action:** Create an async `handleSubmit` function within `AssetsView`. This function should:
        * Prevent default form submission (`e.preventDefault()`).
        * Get the current `portfolioId` from the `usePortfolio` hook.
        * Construct the `assetData` object from the form state.
        * Set a loading state (e.g., `const [isAdding, setIsAdding] = useState(false);`).
        * Call `portfolioService.addAssetToPortfolio(portfolioId, assetData)`.
        * Handle the response (success/error).
        * Reset the loading state.

9.  **Integrate API Call:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js`
    * **Action:** Attach the `handleSubmit` function to the `onSubmit` event of the `<form>` element. Disable the submit button while `isAdding` is true.

10. **Handle Success Response:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js`
    * **Action:** Inside the `handleSubmit` function, after a successful API call:
        * Clear the form input fields by resetting their state.
        * Trigger a refresh of the portfolio data. **Modify `PortfolioContext.js`** to expose a `refreshPortfolio` function that re-fetches the portfolio data using `portfolioService.getPortfolioById`. Call this `refreshPortfolio` function from `AssetsView` on success.

11. **Handle Error Response:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js`
    * **Action:** Inside the `handleSubmit` function's `catch` block:
        * Set an error state (e.g., `const [addError, setAddError] = useState(null);`).
        * Display the error message stored in the `addError` state somewhere near the form.

12. **Add Styling:**
    * **File:** `frontend/src/features/portfolio/views/AssetsView.js` (and potentially component CSS Modules if used)
    * **Action:** Apply Tailwind CSS classes to structure the `AssetsView` layout (e.g., separating the asset list from the add form), style the form, inputs, buttons, list/table, and error messages to match the project's aesthetic. Ensure it looks clean within the `MainContentPanel`.