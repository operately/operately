import React from "react";
import { DimmedLink, IconX } from "turboui";

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface-base">
      <div className="flex flex-col h-full w-full justify-between">
        <div className="flex items-center justify-end p-2">
          <IconX onClick={onClose} className="cursor-pointer text-content-dimmed hover:text-content-accent" size={24} />
        </div>

        <div className="w-full h-[calc(100%-6rem)] flex items-center justify-center">
          <img src={imageSrc} alt={imageAlt} title={imageTitle} className="object-contain max-w-full max-h-full" />
        </div>

        <div className="flex items-center justify-center gap-2 p-2">
          <DimmedLink to={downloadableUrl(imageSrc)}>Download</DimmedLink>
          <div className="text-content-dimmed text-sm">•</div>
          <DimmedLink to={imageSrc} target="_blank">
            View original
          </DimmedLink>
        </div>
      </div>
    </div>
  );
}

function downloadableUrl(url: string) {
  return url + "?disposition=attachment";
}
