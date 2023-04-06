import React from 'react';
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes } from "react-router-dom";
import routes from './routes';

import { ApolloProvider } from '@apollo/client';
import client from './graphql/client';

import socket from "./entity_monitor_socket.js";

let channel = socket.channel("entities:lobby", {})
channel.join()
  .receive("ok", resp => { console.log("Joined successfully", resp) })
  .receive("error", resp => { console.log("Unable to join", resp) })

const rootElement : HTMLElement | null = document.getElementById('root');

const App : JSX.Element = (
  <React.StrictMode>
    <ApolloProvider client={client}>
      <BrowserRouter>
        <Routes>{routes}</Routes>
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>
);

if(rootElement !== null) {
  createRoot(rootElement).render(App)
} else {
  throw new Error('Root element not found');
}
