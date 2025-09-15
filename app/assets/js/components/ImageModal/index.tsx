import React from "react";
import Modal from "@/components/Modal";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageTitle: string;
  imageAlt: string;
}

export function ImageModal({ isOpen, onClose, imageSrc, imageTitle, imageAlt }: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      hideModal={onClose}
      size="xl"
      height="90vh"
      padding="16px"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt}
            title={imageTitle}
            className="max-w-full max-h-full object-contain"
            style={{ width: "auto", height: "auto" }}
          />
        </div>
        
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-surface-outline">
          <a
            className="text-content-dimmed text-sm underline cursor-pointer hover:text-content-accent"
            title={imageTitle}
            href={downloadableUrl(imageSrc)}
          >
            Download
          </a>
          <div className="text-content-dimmed text-sm">•</div>
          <a
            className="text-content-dimmed text-sm underline cursor-pointer hover:text-content-accent"
            href={imageSrc}
            target="_blank"
            rel="noopener noreferrer"
          >
            View original
          </a>
        </div>
      </div>
    </Modal>
  );
}

function downloadableUrl(url: string) {
  return url + "?disposition=attachment";
}