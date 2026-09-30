import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { Link, PrimaryButton } from "@operately/turboui";
import "@operately/turboui/styles.css";

function App() {
  const [clicks, setClicks] = useState(0);

  return (
    <MemoryRouter>
      <div data-test-id="consumer" data-click-count={clicks}>
        <PrimaryButton testId="increment" onClick={() => setClicks((count) => count + 1)}>
          Clicks: {clicks}
        </PrimaryButton>
        <Link testId="project-link" to="/project">
          Project
        </Link>
      </div>
    </MemoryRouter>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing consumer root");
createRoot(root).render(<App />);
