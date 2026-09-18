import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/app.css';
import './styles/auth.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter><App /></HashRouter>
  </React.StrictMode>
);
