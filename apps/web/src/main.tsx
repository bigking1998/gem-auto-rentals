import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { wakeUpServer } from './lib/api';

// Diagnostic only, and dev-only. This used to be a blocking wake-up for
// Render's free tier; the API no longer sleeps, so in production it was just a
// spare request competing with the real data fetch for a connection.
if (import.meta.env.DEV) {
  wakeUpServer();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
