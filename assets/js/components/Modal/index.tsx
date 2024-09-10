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

export default function Modal({ isOpen, hideModal, title, children, minHeight = "600px", width = "600px" }) {
  const mode = useColorMode();

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
          backgroundColor: mode === "light" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)",
          zIndex: 999,
        },
        content: {
          top: "48%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          width: width,
          height: "auto",
          transform: "translate(-50%, -50%)",
          borderRadius: "8px",
          overflowY: "auto",
          maxHeight: "80vh",
          minHeight: minHeight,
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-surface-outline)",
          boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.1)",
        },
      }}
    >
      <div className="flex items-center justify-between text-lg -mx-5 px-5 -mt-5 py-3">
        <h1 className="font-bold">{title}</h1>

        <div
          className="hover:cursor-pointer text-content-dimmed hover:text-content-accent transition-colors"
          onClick={hideModal}
        >
          <Icons.IconX size={20} />
        </div>
      </div>

      {children}
    </ReactModal>
  );
}
