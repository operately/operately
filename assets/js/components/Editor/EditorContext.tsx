import React from "react";

export interface Context {
  linkEditActive: boolean;
  setLinkEditActive: (active: boolean) => void;
}

export const EditorContext = React.createContext<Context | null>(null);
