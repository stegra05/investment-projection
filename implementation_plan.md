# Frontend Implementation Plan: Phase 1 - Auth & Core Structure (Detailed Breakdown)

This plan focuses on completing the authentication flow and setting up the foundational structure for the portfolio workspace, with tasks broken into smaller steps.

## 1. Complete Authentication Flow

* **1.1 Integrate Login API Call:**
    * [x] **1.1.1** Modify `login` action in `src/store/authStore.js`: Remove placeholder `Workspace`, import and call `authService.login(credentials)`.
    * [x] **1.1.2** Implement `authStore.login` success handling: Inside the `try` block, after `authService.login` succeeds, parse the response (assuming it contains `user` data and potentially a token). Update state using `set({ user: data.user, isAuthenticated: true, isLoading: false, error: null })`.
    * [x] **1.1.3** Implement `authStore.login` error handling: Inside the `catch` block, parse the error (e.g., `error.response?.data?.message`), and update state using `set({ error: errorMessage, isLoading: false })`.
    * [x] **1.1.4** Connect `LoginForm` submit: Ensure the `onSubmit` handler in `src/features/auth/components/LoginPage.js` (or `LoginForm.js`) correctly calls the `login` action from the `authStore` with the form data.
    * [x] **1.1.5** Display Login Error: In `src/features/auth/components/LoginPage.js`, read the `error` state from `authStore` and display it conditionally (e.g., in a styled `div` above the form).
    * [x] **1.1.6** Store Token: Decide on token storage (e.g., `localStorage`). In the success handler (1.1.2) within `authStore.login`, store the received access token (e.g., `localStorage.setItem('accessToken', data.access_token)`).
    * Relevant Files: `src/store/authStore.js`, `src/api/authService.js`, `src/features/auth/components/LoginPage.js`, `src/features/auth/components/LoginForm.js`

* **1.2 Implement Axios Auth Interceptor:**
    * [x] **1.2.1** Create/Configure Axios Instance: Create `src/api/axiosInstance.js`. Import `axios`. Create and export an instance: `const instance = axios.create({ baseURL: API_BASE_URL });`.
    * [x] **1.2.2** Add Request Interceptor: In `src/api/axiosInstance.js`, add `instance.interceptors.request.use(...)`. Inside the interceptor, read the token from `localStorage`. If the token exists, add the `Authorization: Bearer ${token}` header to the request config. Return the config.
    * [x] **1.2.3** Use Instance in Services: Modify `src/api/authService.js` (and future services) to import and use `instance` from `axiosInstance.js` instead of the global `axios`.
    * Relevant Files: `src/api/axiosInstance.js` (New/Modify), `src/api/authService.js`

* **1.3 Implement Logout:**
    * [x] **1.3.1** Clear Token on Logout: Update the `logout` action in `src/store/authStore.js` to remove the token from `localStorage` (e.g., `localStorage.removeItem('accessToken')`).
    * [x] **1.3.2** Add Temporary Logout Trigger: Add a basic button inside the placeholder `DashboardPage` component (in `src/App.js` or moved file) that, when clicked, calls the `logout` action from `authStore`.
    * Relevant Files: `src/store/authStore.js`, `src/App.js` (or `src/features/dashboard/pages/DashboardPage.js`)

* **1.4 Create Registration Page & Form:**
    * [x] **1.4.1** Create `RegisterPage.js`: Create the file `src/features/auth/pages/RegisterPage.js`. Add basic JSX structure (e.g., a `div` wrapper) and import/render the `RegisterForm` component (to be created next).
    * [x] **1.4.2** Create `RegisterForm.js` Structure: Create the file `src/features/auth/components/RegisterForm.js`. Add basic form JSX with labels and inputs for `username`, `email`, `password`, and a submit button. Apply basic styling (can copy structure/styles from `LoginForm`).
    * [x] **1.4.3** Implement `RegisterForm` State: In `RegisterForm.js`, use `useState` to manage the form input values. Add `onChange` handlers to update the state.
    * [x] **1.4.4** Add Register Route: In `src/App.js`, import `RegisterPage` and add `<Route path="/register" element={<RegisterPage />} />` within `<Routes>`.
    * [x] **1.4.5** Add Link to Register: In `src/features/auth/components/LoginPage.js`, add a `Link` component (from `react-router-dom`) below the login form, pointing to `/register` (e.g., "Don't have an account? Register").
    * Relevant Files: `src/features/auth/pages/RegisterPage.js` (New), `src/features/auth/components/RegisterForm.js` (New), `src/App.js`, `src/features/auth/components/LoginPage.js`

* **1.5 Integrate Registration API Call:**
    * [x] **1.5.1** Add `register` Function Signature: In `src/api/authService.js`, add `register: async (userData) => { ... }`.
    * [x] **1.5.2** Implement `register` API Call: Inside the `authService.register` function, use the configured Axios instance (`instance`) to make a POST request to `ENDPOINTS.AUTH.REGISTER` with `userData`. Include `try...catch` for error handling.
    * [x] **1.5.3** Handle Form Submission: In `RegisterPage.js` or `RegisterForm.js`, add an `onSubmit` handler to the form. Prevent default form submission. Call the `authService.register` function with the form state. Manage loading state (`useState`).
    * [x] **1.5.4** Handle Registration Success: On successful API call (e.g., in the `.then()` or after `await`), display a success message to the user (e.g., using `alert` or a dedicated state/component) and potentially redirect to the login page (`useNavigate`).
    * [x] **1.5.5** Handle Registration Error: In the `catch` block of the submit handler, display relevant error messages returned from the API (e.g., "Username already exists").
    * Relevant Files: `src/api/authService.js`, `src/features/auth/pages/RegisterPage.js`, `src/features/auth/components/RegisterForm.js`, `src/config/api.js`

## 2. Implement Basic Dashboard

* **2.1 Create Portfolio Service:**
    * [ ] **2.1.1** Create `portfolioService.js`: Create the file `src/api/portfolioService.js`.
    * [ ] **2.1.2** Add `getUserPortfolios` Signature: Add `getUserPortfolios: async () => { ... }` to the service object.
    * [ ] **2.1.3** Implement `getUserPortfolios` API Call: Inside the function, use the configured Axios instance (`instance`) to make a GET request to `ENDPOINTS.PORTFOLIO.LIST`.
    * [ ] **2.1.4** Handle `getUserPortfolios` Response/Error: Return `response.data` in a `try` block. Re-throw or handle errors in a `catch` block.
    * Relevant Files: `src/api/portfolioService.js` (New), `src/config/api.js`, `src/api/axiosInstance.js`

* **2.2 Create Portfolio List Store:**
    * [ ] **2.2.1** Create `portfolioListStore.js`: Create the file `src/store/portfolioListStore.js` and import `create` from `zustand`.
    * [ ] **2.2.2** Define Store State: Inside `create((set) => ({ ... }))`, define initial state: `portfolios: []`, `isLoading: false`, `error: null`.
    * [ ] **2.2.3** Add `WorkspacePortfolios` Action Signature: Define an async action: `WorkspacePortfolios: async () => { ... }`.
    * [ ] **2.2.4** Implement `WorkspacePortfolios` Logic: Inside the action: call `set({ isLoading: true, error: null })`. Use a `try...catch` block. In `try`, call `portfolioService.getUserPortfolios()`. On success, call `set({ portfolios: data, isLoading: false })`. In `catch`, call `set({ error: errorMessage, isLoading: false })`.
    * Relevant Files: `src/store/portfolioListStore.js` (New), `src/api/portfolioService.js`

* **2.3 Update Dashboard Page:**
    * [ ] **2.3.1** Move `DashboardPage`: (Optional but recommended) Create `src/features/dashboard/pages/DashboardPage.js`. Move the `DashboardPage` component definition from `src/App.js` into this new file. Update the import and route in `src/App.js`.
    * [ ] **2.3.2** Use Store State: In `DashboardPage.js`, import `usePortfolioListStore`. Get state needed: `const { portfolios, isLoading, error, fetchPortfolios } = usePortfolioListStore();`.
    * [ ] **2.3.3** Fetch Data on Mount: Import `useEffect` from `react`. Add `useEffect(() => { fetchPortfolios(); }, [fetchPortfolios]);`.
    * [ ] **2.3.4** Render Loading State: Add conditional rendering: `if (isLoading) { return <div>Loading...</div>; }`.
    * [ ] **2.3.5** Render Error State: Add conditional rendering: `if (error) { return <div>Error: {error}</div>; }`.
    * [ ] **2.3.6** Render Portfolio List: Map over the `portfolios` array. For each `portfolio`, render its `name` (e.g., inside an `li` or a `div`). Add a unique `key` prop.
    * [ ] **2.3.7** Add Create Button Stub: Import `Button` component. Add `<Button>Create New Portfolio</Button>` below the list.
    * Relevant Files: `src/features/dashboard/pages/DashboardPage.js` (New/Modify), `src/App.js`, `src/store/portfolioListStore.js`, `src/components/Button/Button.js`

## 3. Set up Portfolio Workspace Structure

* **3.1 Create Portfolio Workspace Page:**
    * [ ] **3.1.1** Create `PortfolioWorkspacePage.js`: Create the file `src/features/portfolio/pages/PortfolioWorkspacePage.js`.
    * [ ] **3.1.2** Basic Component Structure: Add `function PortfolioWorkspacePage() { return (<div>Workspace</div>); } export default PortfolioWorkspacePage;`.
    * Relevant Files: `src/features/portfolio/pages/PortfolioWorkspacePage.js` (New)

* **3.2 Add Routing for Workspace:**
    * [ ] **3.2.1** Add Workspace Route: In `src/App.js`, import `PortfolioWorkspacePage`. Inside the `ProtectedRoute` section, add `<Route path="/portfolio/:portfolioId" element={<PortfolioWorkspacePage />} />`.
    * [ ] **3.2.2** Link from Dashboard: In `DashboardPage.js` (Task 2.3.6), import `Link` from `react-router-dom`. Wrap each rendered portfolio list item with `<Link to={`/portfolio/${portfolio.portfolio_id}`}> ... </Link>` (adjust `portfolio.portfolio_id` based on actual API response structure).
    * Relevant Files: `src/App.js`, `src/features/dashboard/pages/DashboardPage.js`

* **3.3 Create Basic Panel Components:**
    * [ ] **3.3.1** Create `NavigationPanel.js`: Create file `src/features/portfolio/panels/NavigationPanel.js`. Add basic component returning `<div>Navigation Panel</div>`.
    * [ ] **3.3.2** Create `MainContentPanel.js`: Create file `src/features/portfolio/panels/MainContentPanel.js`. Add basic component returning `<div>Main Content Panel</div>`.
    * [ ] **3.3.3** Create `ProjectionPanel.js`: Create file `src/features/portfolio/panels/ProjectionPanel.js`. Add basic component returning `<div>Projection Panel</div>`.
    * [ ] **3.3.4** Render Panels in Workspace: In `PortfolioWorkspacePage.js`, import the three panel components. Render them inside the main `div`.
    * [ ] **3.3.5** Apply Basic Layout: In `PortfolioWorkspacePage.js`, apply Tailwind classes to the main `div` for a multi-column layout, e.g., `className="grid grid-cols-4 gap-4 h-screen"` (adjust columns as needed, e.g., Navigation=1, Main=2, Projection=1). Give placeholder panels different background colors for visibility.
    * Relevant Files: `src/features/portfolio/panels/NavigationPanel.js` (New), `src/features/portfolio/panels/MainContentPanel.js` (New), `src/features/portfolio/panels/ProjectionPanel.js` (New), `src/features/portfolio/pages/PortfolioWorkspacePage.js`

* **3.4 Implement Portfolio Context:**
    * [ ] **3.4.1** Create `PortfolioContext.js`: Create the file `src/features/portfolio/state/PortfolioContext.js`. Import `

