import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { EmbeddingProvider, Link, Modal, PrimaryButton, createKpiDemoFixtures, useKpiDemo } from "@operately/turboui";
import type { KpiDemoFixtures } from "@operately/turboui";
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
        <EmbeddedModal />
        <KpiDemoCheck />
      </div>
    </MemoryRouter>
  );
}

function KpiDemoCheck() {
  const [fixtures] = useState<KpiDemoFixtures>(() => createKpiDemoFixtures({ scenario: "single-entry" }));
  const demo = useKpiDemo(fixtures);
  const kpi = demo.kpis[0];
  if (!kpi) throw new Error("Missing KPI fixture");
  const entry = kpi.latestEntry;
  return (
    <div data-test-id="kpi-demo" data-entry-count={kpi.entries.length} data-comment-count={entry?.commentsCount}>
      <PrimaryButton
        testId="demo-record-value"
        onClick={async () => {
          await demo.actions.onRecordEntry({
            kpiId: kpi.id,
            period: "2099-01-01",
            value: 42,
            comment: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Demo note" }] }] },
          });
        }}
      >
        Log demo value
      </PrimaryButton>
    </div>
  );
}

function EmbeddedModal() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <div
      ref={setContainer}
      data-test-id="embedded-container"
      style={{ position: "relative", transform: "translateZ(0)" }}
    >
      {container && (
        <EmbeddingProvider portalContainer={container} scrollContainer={container} manageDocumentTitle={false}>
          <PrimaryButton testId="open-embedded" onClick={() => setOpen(true)}>
            Open embedded modal
          </PrimaryButton>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Embedded" testId="embedded-modal">
            Published embedding support
          </Modal>
        </EmbeddingProvider>
      )}
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing consumer root");
createRoot(root).render(<App />);
