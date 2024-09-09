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

export default function Modal({ isOpen, hideModal, title, children, minHeight = "600px", width = "800px" }) {
  return (
    <ReactModal
      isOpen={isOpen}
      contentLabel={title}
      ariaHideApp={false}
      overlayClassName="fixed inset-0 bg-modal-overlay backdrop-blur-[2px] z-[999]"
      style={{
        content: {
          padding: "32px",
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
      <div className="flex items-center justify-between text-lg">
        <h1 className="font-bold">{title}</h1>

        <div
          className="hover:cursor-pointer text-content-subtle hover:text-content-accent transition-colors"
          onClick={hideModal}
        >
          <Icons.IconX size={20} />
        </div>
      </div>

      {children}
    </ReactModal>
  );
}
