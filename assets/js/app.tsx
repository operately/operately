import React from 'react';
import { createRoot } from "react-dom/client";
import { RouterProvider, Routes } from "react-router-dom";
import routes from './routes';

import { ApolloProvider } from '@apollo/client';
import client from './graphql/client';

const rootElement : HTMLElement | null = document.getElementById('root');

const App : JSX.Element = (
  <React.StrictMode>
    <ApolloProvider client={client}>
      <RouterProvider router={routes} />
    </ApolloProvider>
  </React.StrictMode>
);

if(rootElement !== null) {
  createRoot(rootElement).render(App)
} else {
  throw new Error('Root element not found');
}
