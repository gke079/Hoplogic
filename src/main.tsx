import React from 'react';
import ReactDOM from 'react-dom/client';
import HopeLogicApp from './bot-app/HopeLogicApp';
import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <HopeLogicApp />
    </React.StrictMode>
  );
}
