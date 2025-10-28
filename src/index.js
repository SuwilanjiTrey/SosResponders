import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';  // Use this instead of 'tailwindcss/tailwind.css'
import App from './App';

// Get the root element
const root = createRoot(document.getElementById('root'));

// Render your app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);