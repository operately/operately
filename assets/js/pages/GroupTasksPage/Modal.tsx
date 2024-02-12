import React from "react";
import ReactModal from "react-modal";
import * as Icons from "@tabler/icons-react";

import { useColorMode } from "@/theme";

export function Modal({ isOpen, hideModal, title, children, minHeight = "600px" }) {
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
          top: "0px",
          left: "50%",
          width: "900px",
          height: "auto",
          marginTop: "150px",
          marginLeft: "-450px",
          borderRadius: "8px",
          overflow: "scroll-y",
          bottom: "auto",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-surface-outline)",
          boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.1)",
        },
      }}
    >
      <div className="flex items-center justify-between text-sm border-b border-surface-outline -mx-5 px-4 -mt-5 py-3">
        <h1 className="font-semibold">{title}</h1>

        <div
          className="hover:cursor-pointer text-content-dimmed hover:text-content-accent transition-colors"
          onClick={hideModal}
        >
          <Icons.IconX size={16} />
        </div>
      </div>

      {children}
    </ReactModal>
  );
}
