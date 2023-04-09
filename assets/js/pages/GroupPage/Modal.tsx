import React from 'react';
import ReactModal from 'react-modal';

export default function Modal({isOpen, hideModal, title, children}) {
  return (
    <ReactModal
      isOpen={isOpen}
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
          bottom: "auto",
          minHeight: "400px"
        }
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold">{title}</h1>

        <div className="hover:cursor-pointer" onClick={hideModal}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>

      {children}
    </ReactModal>
  );
}
