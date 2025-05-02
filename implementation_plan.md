# Frontend Implementation Plan: Phase 2 - Workspace Foundation

This plan focuses on fixing the authentication header issue and implementing the basic structure and navigation for the Portfolio Workspace.

## 1. Finalize Authentication Setup

* [ ] **1.1 Implement Axios Request Interceptor Logic:**
    * **1.1.1** In `src/api/axiosInstance.js`, implement the logic inside the `instance.interceptors.request.use()` callback.
    * **1.1.2** Read the access token correctly from `localStorage` (`localStorage.getItem('accessToken')`).
    * **1.1.3** If the token exists, add the `Authorization` header to the `config.headers` object (e.g., `config.headers.Authorization = \`Bearer ${token}\`;`).
    * **1.1.4** Ensure the modified `config` object is returned from the interceptor.
    * **1.1.5** Test this by logging in and then attempting an action that requires authentication (like fetching portfolios on the dashboard) - check the network request headers in your browser's developer tools.
    * Relevant Files: `src/api/axiosInstance.js`

## 2. Implement Portfolio Context Logic

* [ ] **2.1 Get Portfolio ID in Context Provider:**
    * **2.1.1** In `src/features/portfolio/state/PortfolioContext.js`, inside the `PortfolioProvider` component, import and use the `useParams` hook from `react-router-dom` to extract `portfolioId` from the URL.
    * Relevant Files: `src/features/portfolio/state/PortfolioContext.js`

* [ ] **2.2 Provide Context Value:**
    * **2.2.1** In `PortfolioProvider` (`src/features/portfolio/state/PortfolioContext.js`), pass the extracted `portfolioId` down through the `PortfolioContext.Provider`'s `value` prop. Also include the placeholder state variables (`portfolioData`, `isLoading`, `error`) for now. (e.g., `value={{ portfolioId, portfolioData, isLoading, error }}`).
    * Relevant Files: `src/features/portfolio/state/PortfolioContext.js`

* [ ] **2.3 Wrap Workspace Page (Verification):**
    * **2.3.1** Double-check that the JSX returned by `src/features/portfolio/pages/PortfolioWorkspacePage.js` is correctly wrapped by the `<PortfolioProvider>`.
    * Relevant Files: `src/features/portfolio/pages/PortfolioWorkspacePage.js`

## 3. Implement Functional Navigation Panel

* [ ] **3.1 Fetch/Display Portfolio List in Nav Panel:**
    * **3.1.1** In `src/features/portfolio/panels/NavigationPanel.js`, import and use the `usePortfolioListStore` hook.
    * **3.1.2** Call `WorkspacePortfolios()` in a `useEffect` hook if the `portfolios` array is empty, or rely on the Dashboard having fetched it (consider potential race conditions or need for global fetch).
    * **3.1.3** Render the list of portfolios obtained from the store (`portfolios.map(...)`). Display the `portfolio.name`.
    * Relevant Files: `src/features/portfolio/panels/NavigationPanel.js`, `src/store/portfolioListStore.js`

* [ ] **3.2 Highlight Active Portfolio:**
    * **3.2.1** In `NavigationPanel.js`, import `useContext` and `PortfolioContext`.
    * **3.2.2** Get the current `portfolioId` from the context: `const { portfolioId } = useContext(PortfolioContext);`.
    * **3.2.3** Inside the `portfolios.map()` render logic, apply a conditional background or text style (using Tailwind classes) to the list item if its `portfolio.portfolio_id` matches the `portfolioId` from context. Remember to handle potential type differences (e.g., string vs number).
    * Relevant Files: `src/features/portfolio/panels/NavigationPanel.js`, `src/features/portfolio/state/PortfolioContext.js`

* [ ] **3.3 Implement Navigation on Click:**
    * **3.3.1** In `NavigationPanel.js`, import `useNavigate` from `react-router-dom` and initialize it.
    * **3.3.2** Add an `onClick` handler to each portfolio list item.
    * **3.3.3** In the handler, call `Maps(\`/portfolio/${portfolio.portfolio_id}\`)` using the specific portfolio's ID.
    * Relevant Files: `src/features/portfolio/panels/NavigationPanel.js`

## 4. Implement Basic "Create Portfolio" Functionality

* [ ] **4.1 Add `createPortfolio` Service Function:**
    * **4.1.1** In `src/api/portfolioService.js`, add a new async function `createPortfolio(portfolioData)`.
    * **4.1.2** Implement the API call logic inside this function: use the Axios instance to make a POST request to the portfolio creation endpoint (`ENDPOINTS.PORTFOLIO.LIST` or a dedicated create endpoint if different) with `portfolioData` (likely `{ name: '...', description: '...' }`).
    * **4.1.3** Handle success (return response data) and errors (throw/handle error).
    * Relevant Files: `src/api/portfolioService.js`, `src/config/api.js`

* [ ] **4.2 Create Basic "Create Portfolio" Form/Modal:**
    * **4.2.1** Create a new component, e.g., `src/features/dashboard/components/CreatePortfolioModal.js`.
    * **4.2.2** Use basic `useState` to manage modal visibility (open/closed).
    * **4.2.3** Inside the component (when visible), render a simple form with inputs for `name` and `description`. Use your reusable `Input` and `Button` components.
    * **4.2.4** Add state management for the form inputs (`name`, `description`).
    * Relevant Files: `src/features/dashboard/components/CreatePortfolioModal.js` (New), `src/components/Input/Input.js`, `src/components/Button/Button.js`

* [ ] **4.3 Integrate Modal into Dashboard:**
    * **4.3.1** In `src/features/dashboard/pages/DashboardPage.js`, import and render the `CreatePortfolioModal`.
    * **4.3.2** Add state (`useState`) to `DashboardPage` to control the modal's visibility (e.g., `isModalOpen`, `setIsModalOpen`). Pass this state and setter down to the modal component.
    * **4.3.3** Modify the "Create New Portfolio" button's `onClick` handler to set `isModalOpen` to `true`.
    * Relevant Files: `src/features/dashboard/pages/DashboardPage.js`, `src/features/dashboard/components/CreatePortfolioModal.js`

* [ ] **4.4 Handle Form Submission in Modal:**
    * **4.4.1** Add an `onSubmit` handler to the form inside `CreatePortfolioModal.js`.
    * **4.4.2** In the handler, prevent default submission. Call the `portfolioService.createPortfolio` function with the form data (`{ name, description }`).
    * **4.4.3** Handle the promise/async call: On success, close the modal (`setIsModalOpen(false)` passed down as prop), potentially show a success message, and importantly, refresh the portfolio list by calling `WorkspacePortfolios()` from the `portfolioListStore`.
    * **4.4.4** On failure, display an error message within the modal.
    * **4.4.5** Add loading state management during the API call.
    * Relevant Files: `src/features/dashboard/components/CreatePortfolioModal.js`, `src/api/portfolioService.js`, `src/store/portfolioListStore.js`