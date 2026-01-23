import React from "react";
import ReactModal from "react-modal";
import { IconX } from "turboui";

import { useColorMode } from "@/contexts/ThemeContext";

interface ModalProps {
  isOpen: boolean;
  hideModal?: () => void;
  title?: string;
  children: React.ReactNode;

  height?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl";
  padding?: string;
}

const SIZES = {
  xs: "400px",
  sm: "500px",
  base: "700px",
  lg: "900px",
  xl: "1200px",
};

export default function Modal({ isOpen, hideModal, title, children, height, size, padding }: ModalProps) {
  size = size ?? "base";
  height = height ?? "auto";

  const { ref, autoFocusOnOpen } = useAutoFocusOnOpen();
  const modalStyle = useModalStyle(size, height, padding);
  const showHeader = Boolean(title && hideModal);

  return (
    <ReactModal isOpen={isOpen} contentLabel={title} ref={ref} onAfterOpen={autoFocusOnOpen} style={modalStyle}>
      {showHeader && <Header title={title} hideModal={hideModal} />}
      <div className="flex-1">{children}</div>
    </ReactModal>
  );
}

function Header({ title, hideModal }) {
  return (
    <div className="flex items-center justify-between text-lg pb-6">
      <h1 className="font-bold">{title}</h1>
      <CloseButton hideModal={hideModal} />
    </div>
  );
}

function CloseButton({ hideModal }) {
  return (
    <div
      className="hover:cursor-pointer text-content-dimmed hover:text-content-accent transition-colors"
      onClick={hideModal}
    >
      <IconX size={20} />
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

function useModalStyle(size: string, height: string, padding?: string): ReactModal.Styles {
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
        width: SIZES[size],
        transform: "translate(-50%, -50%)",
        borderRadius: "8px",
        overflowY: "auto",
        maxHeight: "90%",
        height: height,
        maxWidth: "95%",
        backgroundColor: "var(--color-surface-base)",
        border: "1px solid var(--color-surface-outline)",
        boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.1)",
        padding: padding ?? "32px",
        display: "flex",
        flexDirection: "column",
      },
    } as ReactModal.Styles;
  }, [mode, size, height]);
}
