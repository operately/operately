import React from "react";
import ReactModal from 'react-modal';

export default function Modal({showModal, children}) {
  return (
    <ReactModal
      isOpen={showModal}
      contentLabel="Minimal Modal Example"
      style={{
        overlay: {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.6)',
          zIndex: 999
        },
        content: {
          top: "0px",
          left: "50%",
          width: "600px",
          height: "0px",
          marginTop: "150px",
          marginLeft: "-300px",
          borderRadius: "8px",
          overflow: "scroll-y",
          heigth: "auto",
          bottom: "auto",
          minHeight: "400px"
        }
      }}
    >
      {children}
    </ReactModal>
  );
}
