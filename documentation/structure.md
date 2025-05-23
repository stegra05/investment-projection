```
.
├── .dockerignore
├── .env.example
├── .gitignore
├── LICENSE
├── README.md
├── backend/
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── app/
│   │   ├── __init__.py
│   │   ├── background_workers.py
│   │   ├── config/
│   │   │   └── return_config.py
│   │   ├── enums.py
│   │   ├── error_handlers.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── asset.py
│   │   │   ├── planned_future_change.py
│   │   │   ├── portfolio.py
│   │   │   ├── user.py
│   │   │   └── user_celery_task.py
│   │   ├── routes/
│   │   │   ├── analytics.py
│   │   │   ├── assets.py
│   │   │   ├── auth.py
│   │   │   ├── changes.py
│   │   │   ├── main.py
│   │   │   ├── portfolios.py
│   │   │   ├── projections.py
│   │   │   ├── tasks.py
│   │   │   └── user_settings_routes.py
│   │   ├── schemas/
│   │   │   ├── analytics_schemas.py
│   │   │   ├── auth_schemas.py
│   │   │   ├── portfolio_schemas.py
│   │   │   └── user_schemas.py
│   │   ├── services/
│   │   │   ├── analytics_service.py
│   │   │   ├── historical_data_preparation.py
│   │   │   ├── monthly_calculator.py
│   │   │   ├── projection_engine.py
│   │   │   ├── projection_initializer.py
│   │   │   ├── recurrence_service.py
│   │   │   ├── return_strategies.py
│   │   │   └── task_service.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── decorators.py
│   │       ├── exceptions.py
│   │       └── helpers.py
│   ├── celery_worker.py
│   ├── config.py
│   ├── dev-app.db
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── run.py
│   ├── setup.py
│   └── tests/
│       ├── __init__.py
│       ├── celery/
│       │   ├── __init__.py
│       │   └── test_tasks.py
│       ├── conftest.py
│       ├── integration/
│       │   ├── __init__.py
│       │   ├── test_analytics_routes.py
│       │   ├── test_asset_routes.py
│       │   ├── test_auth_routes.py
│       │   ├── test_changes_routes.py
│       │   ├── test_main_routes.py
│       │   ├── test_portfolio_routes.py
│       │   ├── test_projections_routes.py
│       │   ├── test_task_routes.py
│       │   └── test_user_settings_routes.py
│       └── unit/
│           ├── test_models.py
│           └── test_services.py
├── docker-compose.yml
├── documentation/
│   ├── api_specification.md
│   ├── architecture.md
│   ├── database_scheme.md
│   ├── docker_cheatsheet.md
│   ├── frontend_plan.md
│   ├── functional_requirements.md
│   ├── non_functional_requirements.md
│   ├── structure.md
│   └── technology_stack.md
└── frontend/
    ├── .babelrc
    ├── .dockerignore
    ├── .editorconfig
    ├── .prettierrc.js
    ├── Dockerfile
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── public/
    │   └── manifest.json
    ├── src/
    │   ├── App.jsx
    │   ├── api/
    │   │   ├── analyticsService.js
    │   │   ├── assetService.js
    │   │   ├── authService.js
    │   │   ├── axiosInstance.js
    │   │   ├── plannedChangeService.js
    │   │   ├── portfolioService.js
    │   │   ├── projectionService.js
    │   │   └── settingsService.js
    │   ├── components/
    │   │   ├── AlertMessage/
    │   │   │   └── AlertMessage.jsx
    │   │   ├── Button/
    │   │   │   ├── Button.jsx
    │   │   │   └── IconButton.jsx
    │   │   ├── Input/
    │   │   │   └── InputField.jsx
    │   │   ├── Layout/
    │   │   │   └── MainLayout.jsx
    │   │   ├── Modal/
    │   │   │   ├── ConfirmationModal.jsx
    │   │   │   └── Modal.jsx
    │   │   ├── Notification/
    │   │   │   ├── Notification.jsx
    │   │   │   ├── NotificationContainer.jsx
    │   │   │   ├── NotificationContext.jsx
    │   │   │   └── useNotification.js
    │   │   ├── Select/
    │   │   │   └── SelectField.jsx
    │   │   ├── SkeletonLoader/
    │   │   │   └── SkeletonLoader.jsx
    │   │   └── Spinner/
    │   │       └── Spinner.jsx
    │   ├── config/
    │   │   └── api.js
    │   ├── constants/
    │   │   ├── portfolioConstants.js
    │   │   └── textConstants.js
    │   ├── features/
    │   │   ├── auth/
    │   │   │   ├── components/
    │   │   │   │   ├── AuthForm.jsx
    │   │   │   │   └── AuthWrapper.jsx
    │   │   │   ├── pages/
    │   │   │   │   ├── LoginPage.jsx
    │   │   │   │   └── RegistrationPage.jsx
    │   │   │   └── utils/
    │   │   │       └── validation.js
    │   │   ├── dashboard/
    │   │   │   ├── components/
    │   │   │   │   ├── PortfolioCard.jsx
    │   │   │   │   └── PortfolioList.jsx
    │   │   │   ├── pages/
    │   │   │   │   └── DashboardPage.jsx
    │   │   └── portfolio/
    │   │       ├── components/
    │   │       │   ├── AssetAllocationChart.jsx
    │   │       │   ├── AssetForm.jsx
    │   │       │   ├── AssetTable.jsx
    │   │       │   ├── DeleteConfirmationModal.jsx
    │   │       │   ├── MainContentPanel.jsx
    │   │       │   ├── NavigationPanel.jsx
    │   │       │   ├── PlannedChangeForm.jsx
    │   │       │   ├── PlannedChangesTable.jsx
    │   │       │   ├── PortfolioControls.jsx
    │   │       │   ├── PortfolioHeader.jsx
    │   │       │   ├── PortfolioTitle.jsx
    │   │       │   ├── ProjectionChart.jsx
    │   │       │   ├── ProjectionControls.jsx
    │   │       │   ├── ProjectionPanel.jsx
    │   │       │   ├── QuickAddMenu.jsx
    │   │       │   ├── SettingsContent.jsx
    │   │       │   ├── Sidebar.jsx
    │   │       │   └── ValueDisplay.jsx
    │   │       ├── hooks/
    │   │       │   └── usePortfolioCalculations.js
    │   │       ├── layouts/
    │   │       │   └── PortfolioLayout.jsx
    │   │       ├── pages/
    │   │       │   └── PortfolioWorkspacePage.jsx
    │   │       ├── utils/
    │   │       │   ├── chartUtils.js
    │   │       │   ├── dateUtils.js
    │   │       │   ├── formattingUtils.js
    │   │       │   ├── localStorageUtils.js
    │   │       │   └── portfolioUtils.js
    │   │       └── views/
    │   │           ├── AssetView.jsx
    │   │           ├── OverviewView.jsx
    │   │           ├── PlannedChangesView.jsx
    │   │           └── SettingsView.jsx
    │   ├── hooks/
    │   │   ├── useNotification.js
    │   │   └── useTheme.js
    │   ├── index.jsx
    │   ├── store/
    │   │   ├── authStore.js
    │   │   ├── notificationStore.js
    │   │   ├── portfolioListStore.js
    │   │   ├── settingsStore.js
    │   │   └── themeStore.js
    │   └── styles/
    │       └── index.css
    ├── tailwind.config.js
    └── vite.config.js
```
