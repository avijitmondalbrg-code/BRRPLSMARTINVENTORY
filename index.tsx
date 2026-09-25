import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Removed manual process.env definition as per @google/genai guidelines.
// The API key must be obtained exclusively from the environment variable process.env.API_KEY,
// which is assumed to be pre-configured and accessible in the execution context.

// Safe unhandled rejection listener to catch and prevent circular error serialization
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason) {
    const reasonStr = (typeof event.reason === 'object' && event.reason !== null && event.reason.message)
      ? String(event.reason.message)
      : String(event.reason);
    if (reasonStr.includes('Firestore') || reasonStr.includes('backend') || reasonStr.includes('circular')) {
      event.preventDefault();
      console.warn('[Handled Background Rejection]:', reasonStr);
    }
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
