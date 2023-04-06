import React from 'react';
import ReactDOMClient from 'react-dom/client';

function App() : JSX.Element {
  return (
    <div>
      <h1>Hello, world!</h1>
    </div>
  );
}

const rootElement : HTMLElement | null = document.getElementById('root');

if(rootElement !== null) {
  const root = ReactDOMClient.createRoot(rootElement);
  root.render(<App />);
} else {
  throw new Error('Root element not found');
}
