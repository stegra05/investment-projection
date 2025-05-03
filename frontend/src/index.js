import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css'; // Correct path to global styles
import 'allotment/dist/style.css'; // Import Allotment styles
import App from './App';
// import reportWebVitals from './reportWebVitals'; // Removed unused import

// Global CSS for Allotment sash styling
const globalStyle = document.createElement('style');
globalStyle.innerHTML = `
  /* Basic Sash Styling */
  .allotment-sash-vertical { /* Adjust if horizontal */
    background-color: #e5e7eb; /* gray-200 */
    width: 1px;
    position: relative; /* Needed for pseudo-element */
    transition: background-color 0.2s ease, width 0.2s ease;
  }

  /* Invisible thicker hit area */
  .allotment-sash-vertical::before {
    content: '';
    position: absolute;
    left: -4px; /* Center the hit area */
    right: -4px; /* Center the hit area */
    top: 0;
    bottom: 0;
    cursor: col-resize;
    z-index: 10; /* Ensure it's above content */
  }

  /* Hover state */
  .allotment-sash-vertical:hover {
    background-color: #6366f1; /* Use a default primary color - adjust if needed */
    width: 5px;
    /* Center the thicker handle visually */
    margin-left: -2px;
    margin-right: -2px;
  }

  /* Optional: Add grabber dots on hover */
  .allotment-sash-vertical:hover::after {
    content: '...'; /* Or use an SVG icon */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(90deg); /* Vertical dots */
    color: white; /* Or contrasting color */
    font-size: 10px;
    letter-spacing: 1px;
    pointer-events: none; /* Don't interfere with drag */
    z-index: 11;
  }
`;
document.head.appendChild(globalStyle);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals(); // Removed call 