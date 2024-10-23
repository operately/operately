import React from "react";

// icon is optional
export const Subheader = ({ content, icon: Icon }) => {
  return (
    <div className="border-b border-surface-outline mb-4">
      <div className="px-2 py-2">
        <div className="font-medium text-content-base text-lg mb-2">
          <div className="flex items-center gap-1">
            {Icon && <Icon size={20} />}
            {Icon && " "}
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DimmedLabel = ({ children, className = "" }) => (
  <div className={`text-xs uppercase font-medium text-content-dimmed tracking-wider ${className}`}>{children}</div>
);
