import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

console.log('main.tsx loaded');
const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('App rendered');
