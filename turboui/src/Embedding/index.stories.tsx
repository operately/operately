import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmbeddingProvider } from ".";
import { Modal } from "../Modal";
import { PrimaryButton } from "../Button";

function EmbeddedDialog() {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  return (
    <div ref={setContainer} style={{ position: "relative", height: 400, transform: "translateZ(0)", overflow: "auto" }}>
      {container && (
        <EmbeddingProvider portalContainer={container} scrollContainer={container} manageDocumentTitle={false}>
          <PrimaryButton onClick={() => setOpen(true)}>Open embedded dialog</PrimaryButton>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Embedded dialog">
            This dialog stays within the preview container.
          </Modal>
        </EmbeddingProvider>
      )}
    </div>
  );
}

export default { title: "Utilities/Embedding", component: EmbeddedDialog } satisfies Meta<typeof EmbeddedDialog>;
export const Dialog: StoryObj<typeof EmbeddedDialog> = {};
