import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { Link, PrimaryButton } from "@operately/turboui";
import "@operately/turboui/styles.css";

function App() {
  const [clicks, setClicks] = useState(0);

  return (
    <MemoryRouter>
      <PrimaryButton onClick={() => setClicks((count) => count + 1)}>Clicks: {clicks}</PrimaryButton>
      <Link to="/project">Project</Link>
    </MemoryRouter>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing consumer root");
createRoot(root).render(<App />);
