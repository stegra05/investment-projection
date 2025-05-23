import React from 'react'; // Core React library.
import ReactDOM from 'react-dom/client'; // React's library for DOM rendering.
import './styles/index.css'; // Main global stylesheet for the application (includes Tailwind CSS).
import 'allotment/dist/style.css'; // Base CSS styles required for the 'allotment' resizable pane component.
import App from './App.jsx'; // The root component of the application.

/**
 * @file index.jsx
 * @description This is the main entry point for the React application.
 * It sets up the root React DOM renderer, imports necessary global styles,
 * and renders the main `App` component into the DOM, effectively starting the application.
 * `React.StrictMode` is used to highlight potential problems during development.
 */

// Create a new React root instance for concurrent rendering.
// This targets the `div` element with the ID 'root' in the public/index.html file.
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the application.
root.render(
  // React.StrictMode is a wrapper component that checks for potential problems
  // in an application during development. It does not affect the production build.
  // It helps with identifying unsafe lifecycles, legacy API usage, unexpected side effects, etc.
  <React.StrictMode>
    {/* App component is the root component where all other components and routing are managed. */}
    <App />
  </React.StrictMode>
);
// Note: If global context providers (e.g., for Theme, Authentication without store persistence for initial load)
// were needed at the very root, they would typically wrap the <App /> component here.
// For example:
// <ThemeProvider>
//   <AuthProvider>
//     <App />
//   </AuthProvider>
// </ThemeProvider>
// However, this application uses Zustand stores with persistence or context providers within App.jsx itself.