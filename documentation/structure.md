Directory structure:
└── stegra05-investment-projection/
    ├── README.md
    ├── LICENSE
    ├── start_dev_env.sh
    ├── stop_dev_env.sh
    ├── backend/
    │   ├── celery_worker.py
    │   ├── config.py
    │   ├── dev-app.db
    │   ├── pytest.ini
    │   ├── requirements.txt
    │   ├── run.py
    │   ├── setup.py
    │   ├── .env.example
    │   └── app/
    │       ├── __init__.py
    │       ├── background_workers.py
    │       ├── enums.py
    │       ├── error_handlers.py
    │       ├── models/
    │       │   ├── __init__.py
    │       │   ├── asset.py
    │       │   ├── planned_future_change.py
    │       │   ├── portfolio.py
    │       │   └── user.py
    │       ├── routes/
    │       │   ├── analytics.py
    │       │   ├── assets.py
    │       │   ├── auth.py
    │       │   ├── changes.py
    │       │   ├── main.py
    │       │   ├── portfolios.py
    │       │   ├── projections.py
    │       │   └── tasks.py
    │       ├── schemas/
    │       │   ├── analytics_schemas.py
    │       │   ├── auth_schemas.py
    │       │   └── portfolio_schemas.py
    │       ├── services/
    │       │   ├── analytics_service.py
    │       │   ├── historical_data_preparation.py
    │       │   ├── monthly_calculator.py
    │       │   ├── projection_engine.py
    │       │   ├── projection_initializer.py
    │       │   ├── recurrence_service.py
    │       │   ├── return_strategies.py
    │       │   └── task_service.py
    │       └── utils/
    │           ├── __init__.py
    │           ├── decorators.py
    │           ├── exceptions.py
    │           └── helpers.py
    ├── documentation/
    │   ├── api_specification.md
    │   ├── architecture.md
    │   ├── database_scheme.md
    │   ├── frontend_plan.md
    │   ├── functional_requirements.md
    │   ├── non_functional_requirements.md
    │   ├── structure.md
    │   └── technology_stack.md
    └── frontend/
        ├── package.json
        ├── postcss.config.js
        ├── tailwind.config.js
        ├── .babelrc
        ├── .editorconfig
        ├── .eslintrc.js
        ├── .prettierrc.js
        ├── public/
        │   ├── index.html
        │   └── manifest.json
        └── src/
            ├── App.js
            ├── index.js
            ├── api/
            │   ├── analyticsService.js
            │   ├── assetService.js
            │   ├── authService.js
            │   ├── axiosInstance.js
            │   ├── plannedChangeService.js
            │   ├── portfolioService.js
            │   └── projectionService.js
            ├── components/
            │   ├── AlertMessage/
            │   │   └── AlertMessage.js
            │   ├── Button/
            │   │   ├── Button.js
            │   │   └── Button.module.css
            │   ├── Input/
            │   │   └── Input.js
            │   ├── Layout/
            │   │   └── Layout.js
            │   ├── Modal/
            │   │   ├── ConfirmationModal.js
            │   │   └── Modal.module.css
            │   ├── Notification/
            │   │   ├── NotificationContainer.js
            │   │   ├── NotificationContainer.module.css
            │   │   ├── ToastMessage.js
            │   │   └── ToastMessage.module.css
            │   ├── Select/
            │   │   └── Select.js
            │   └── Spinner/
            │       └── Spinner.js
            ├── config/
            │   └── api.js
            ├── constants/
            │   ├── portfolioConstants.js
            │   └── textConstants.js
            ├── features/
            │   ├── auth/
            │   │   ├── components/
            │   │   │   ├── LoginForm.js
            │   │   │   ├── LoginForm.module.css
            │   │   │   └── RegisterForm.js
            │   │   └── pages/
            │   │       ├── LoginPage.js
            │   │       └── RegisterPage.js
            │   ├── dashboard/
            │   │   ├── components/
            │   │   │   └── CreatePortfolioModal.js
            │   │   └── pages/
            │   │       └── DashboardPage.js
            │   └── portfolio/
            │       ├── components/
            │       │   ├── AddAssetForm.js
            │       │   ├── AddEditChangePanel.js
            │       │   ├── AssetList.js
            │       │   ├── ChangeDetailsList.js
            │       │   ├── ChangeFilters.js
            │       │   ├── ChangeItemCard.js
            │       │   ├── EditAssetModal.js
            │       │   ├── ProjectionChart.js
            │       │   ├── ProjectionParamsForm.js
            │       │   ├── ProjectionSummaryMetrics.js
            │       │   ├── RecurrenceSettingsForm.js
            │       │   ├── RiskProfileDisplay.js
            │       │   ├── TargetAllocationInput.js
            │       │   └── TimelineView.js
            │       ├── hooks/
            │       │   ├── useAssetCRUD.js
            │       │   ├── useChangePanelActions.js
            │       │   ├── useFilteredChanges.js
            │       │   ├── usePlannedChangeCRUD.js
            │       │   ├── usePlannedChangeForm.js
            │       │   ├── useProjectionTask.js
            │       │   └── useRecurrenceForm.js
            │       ├── pages/
            │       │   └── PortfolioWorkspacePage.js
            │       ├── panels/
            │       │   ├── MainContentPanel.js
            │       │   ├── NavigationPanel.js
            │       │   └── ProjectionPanel.js
            │       ├── state/
            │       │   └── PortfolioContext.js
            │       ├── utils/
            │       │   ├── iconUtils.js
            │       │   └── plannedChangeUtils.js
            │       └── views/
            │           ├── AssetsView.js
            │           └── ChangesView.js
            ├── hooks/
            │   └── useNotification.js
            ├── store/
            │   ├── authStore.js
            │   ├── notificationStore.js
            │   └── portfolioListStore.js
            └── styles/
                └── index.css
