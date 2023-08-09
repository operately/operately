import React from "react";
import ReactModal from "react-modal";
import * as Icons from "@tabler/icons-react";

export default function Modal({ isOpen, hideModal, title, children }) {
  return (
    <ReactModal
      isOpen={isOpen}
      contentLabel="Add Members Modal"
      ariaHideApp={false}
      style={{
        overlay: {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 999,
        },
        content: {
          top: "0px",
          left: "50%",
          width: "600px",
          height: "auto",
          marginTop: "150px",
          marginLeft: "-300px",
          borderRadius: "8px",
          overflow: "scroll-y",
          bottom: "auto",
          minHeight: "600px",
          backgroundColor: "var(--color-dark-2)",
          border: "1px solid var(--color-dark-3)",
          boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.75)",
        },
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold">{title}</h1>

        <div className="hover:cursor-pointer text-white-3 hover:text-white-1 transition-colors" onClick={hideModal}>
          <Icons.IconX size={24} />
        </div>
      </div>

      {children}
    </ReactModal>
  );
}
