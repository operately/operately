import React from "react";
import ReactModal from "react-modal";
import * as Icons from "@tabler/icons-react";

import { useColorMode } from "@/contexts/ThemeContext";

export interface ModalState {
  isOpen: boolean;
  show: () => void;
  hide: () => void;
}

export function useModalState(initial?: boolean): ModalState {
  const [isOpen, setIsOpen] = React.useState<boolean>(initial || false);

  const showModal = () => setIsOpen(true);
  const hideModal = () => setIsOpen(false);

  return { isOpen, show: showModal, hide: hideModal };
}

interface ModalProps {
  isOpen: boolean;
  hideModal?: () => void;
  title?: string;
  children: React.ReactNode;

  height?: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl";
}

const SIZES = {
  xs: "400px",
  sm: "500px",
  base: "700px",
  lg: "900px",
  xl: "1200px",
};

export default function Modal({ isOpen, hideModal, title, children, height, size }: ModalProps) {
  const mode = useColorMode();
  size = size ?? "base";

  return (
    <ReactModal
      isOpen={isOpen}
      contentLabel={title}
      ariaHideApp={false}
      style={{
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
          height: height ?? "auto",
          maxWidth: "95%",
          backgroundColor: "var(--color-surface-base)",
          border: "1px solid var(--color-surface-outline)",
          boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.1)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {Boolean(title && hideModal) && <Header title={title} hideModal={hideModal} />}
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
      <Icons.IconX size={20} />
    </div>
  );
}
