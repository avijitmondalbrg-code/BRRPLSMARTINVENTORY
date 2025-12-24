import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Removed manual process.env definition as per @google/genai guidelines.
// The API key must be obtained exclusively from the environment variable process.env.API_KEY,
// which is assumed to be pre-configured and accessible in the execution context.

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