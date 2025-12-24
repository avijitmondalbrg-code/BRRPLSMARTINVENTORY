
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global polyfill for process.env in browser
if (typeof window !== 'undefined') {
  (window as any).process = { env: { API_KEY: '' }, ...(window as any).process };
}

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
