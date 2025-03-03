import React from "react";
import ReactModal from "react-modal";
import * as Icons from "@tabler/icons-react";

import { useColorMode } from "@/contexts/ThemeContext";
import { useRouter } from "@/routes/Router";

export default function PeekWindow() {
  const { isPeekWindowOpen, closePeekWindow, peekWindowElement } = useRouter();
  const { ref, autoFocusOnOpen } = useAutoFocusOnOpen();
  const modalStyle = useWindowStyle();

  return (
    <ReactModal
      isOpen={isPeekWindowOpen}
      ref={ref}
      onAfterOpen={autoFocusOnOpen}
      style={modalStyle}
      shouldCloseOnOverlayClick={true}
      shouldCloseOnEsc={true}
      onRequestClose={closePeekWindow}
    >
      <Header />
      <div className="flex-1 max-h-[85vh] overflow-scroll px-12 py-4">{peekWindowElement}</div>
    </ReactModal>
  );
}

function Header() {
  const { expandPeekWindow } = useRouter();

  return (
    <div className="mt-[-1rem] ml-[-1rem]">
      <Icons.IconArrowsDiagonal2 size={18} onClick={expandPeekWindow} className="text-content-subtle cursor-pointer" />
    </div>
  );
}

function useAutoFocusOnOpen() {
  const ref = React.useRef(null);

  const autoFocusOnOpen = React.useCallback(() => {
    if (ref.current) {
      const current = ref.current as any;
      const node = current.node as HTMLElement;

      const firstInput = node.querySelector("[data-autofocus]");

      if (firstInput && firstInput instanceof HTMLElement) {
        firstInput.focus();
      }
    }
  }, []);

  return { ref, autoFocusOnOpen };
}

function useWindowStyle(): ReactModal.Styles {
  const mode = useColorMode();

  return React.useMemo(() => {
    return {
      overlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: mode === "light" ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.7)",
        zIndex: 999,
      },
      content: {
        top: "48%",
        left: "50%",
        right: "auto",
        bottom: "auto",
        width: "1100px",
        transform: "translate(-50%, -50%)",
        borderRadius: "8px",
        overflowY: "auto",
        maxHeight: "90vh",
        height: "auto",
        maxWidth: "95%",
        backgroundColor: "var(--color-surface-base)",
        border: "1px solid var(--color-surface-outline)",
        boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.1)",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      },
    } as ReactModal.Styles;
  }, [mode]);
}
