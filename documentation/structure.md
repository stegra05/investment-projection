frontend/
├── public/
│   ├── index.html
│   └── ... (other static assets like favicons)
├── src/
│   ├── App.js                # Root component, routing setup (React Router)
│   ├── index.js              # App entry point
│
│   ├── assets/               # Static assets (images, fonts, svgs)
│   │   └── ...
│
│   ├── components/           # SHARED, Reusable UI Components (Presentational)
│   │   ├── Button/           # Atomic component example
│   │   │   ├── Button.js
│   │   │   ├── Button.module.css # Optional styling
│   │   │   ├── Button.test.js    # Co-located test
│   │   │   └── Button.stories.js # Optional Storybook file
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Spinner/
│   │   ├── ChartWrapper/     # Wrapper around Recharts if customization needed
│   │   └── ... (other shared elements like Card, Tooltip)
│
│   ├── config/               # App-wide configuration
│   │   └── api.js            # API base URL, endpoints constants
│   │   └── constants.js      # Other app-wide constants
│
│   ├── features/             # CORE: Feature-based modules
│   │   ├── auth/             # Authentication feature
│   │   │   ├── components/   # Components specific to auth (LoginForm, RegisterForm)
│   │   │   ├── hooks/        # Custom hooks for auth logic (useLogin, useRegister)
│   │   │   ├── pages/        # Auth pages/views + tests co-located
│   │   │   │   ├── LoginPage.js
│   │   │   │   └── LoginPage.test.js
│   │   │   └── index.js      # Barrel file to export feature elements
│   │   ├── dashboard/        # Dashboard feature
│   │   │   └── ...           # Similar structure (components, hooks, pages, index)
│   │   └── portfolio/        # Portfolio Workspace feature (Multi-Panel)
│   │       ├── components/   # Shared components ONLY within portfolio workspace (PanelWrapper, AssetRow)
│   │       ├── hooks/        # Hooks specific to portfolio workspace (useSelectedPortfolio, useProjectionRunner)
│   │       ├── panels/       # Components representing the main panels + tests
│   │       │   ├── NavigationPanel.js
│   │       │   ├── MainContentPanel.js
│   │       │   └── ProjectionPanel.js
│   │       ├── views/        # Views/Tabs potentially within MainContentPanel + tests
│   │       │   ├── AssetsView.js
│   │       │   ├── ChangesView.js
│   │       │   └── OverviewSettingsView.js
│   │       ├── workflows/    # Components for guided workflows + tests
│   │       │   ├── OnboardingWorkflow.js
│   │       │   └── ProjectionSetupWorkflow.js
│   │       ├── state/        # Workspace-specific Context/State logic
│   │       │   └── PortfolioContext.js # Example for selected portfolio
│   │       ├── pages/        # The main PortfolioWorkspacePage component orchestrating panels + tests
│   │       └── index.js
│
│   ├── hooks/                # GLOBAL Custom Hooks (used across features)
│   │   ├── useAuth.js        # Example hook interacting with auth state/context
│   │   └── useApi.js         # Optional hook abstracting Axios calls
│
│   ├── utils/                # Utility functions (date formatting, validation) + tests
│   │   └── formatDate.js
│   │   └── validators.js
│
│   ├── routes/               # Route definitions (centralized or co-located in features)
│   │   └── index.js
│
│   ├── api/                  # API layer (Axios instances, request functions)
│   │   ├── authService.js
│   │   ├── portfolioService.js
│   │   └── projectionService.js
│
│   ├── store/                # GLOBAL State Management (Zustand stores)
│   │   ├── authStore.js
│   │   └── portfolioListStore.js
│
│   ├── styles/               # Global styles, Tailwind config
│   │   ├── index.css         # Main CSS entry point, Tailwind directives
│   │   └── tailwind.config.js
│
│   └── types/                # Optional: For shared TypeScript interfaces/types
│       └── index.d.ts
│
├── tests/                    # Optional: Alternative top-level test dir (e.g., for e2e tests)
├── .eslintrc.js              # ESLint config
├── .prettierrc.js            # Prettier config
├── babel.config.js or .babelrc # Babel config
├── jsconfig.json or tsconfig.json # Setup path aliases here (e.g., @components/*, @features/*)
├── package.json
└── tailwind.config.js        # Can be here or in src/styles