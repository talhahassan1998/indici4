import React from 'react';
import { createRoot } from 'react-dom/client';
import Login from './views/Login.jsx';
import { UiProvider } from './lib/ui.jsx';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/app.css';
import './styles/auth.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode><UiProvider><Login /></UiProvider></React.StrictMode>
);
