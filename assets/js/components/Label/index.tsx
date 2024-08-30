import React from "react";

export const DimmedLabel = ({ children, className = "" }) => (
  <div className={`text-xs uppercase font-medium text-content-dimmed tracking-wider ${className}`}>
    {children}
  </div>
);