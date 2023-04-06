import React from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes } from "react-router-dom";
import routes from './routes';

const rootElement : HTMLElement | null = document.getElementById('root');

const App : JSX.Element = (
  <React.StrictMode>
    <BrowserRouter>
      <Routes>{routes}</Routes>
    </BrowserRouter>
  </React.StrictMode>
);

if(rootElement !== null) {
  createRoot(rootElement).render(App)
} else {
  throw new Error('Root element not found');
}
