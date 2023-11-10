import React from "react";

export const Label = ({ children }) => (
  <div className="text-xs uppercase text-content-accent font-bold mb-1">{children}</div>
);

export const DimmedLabel = ({ children }) => <div className="text-xs uppercase font-medium mb-1">{children}</div>;
