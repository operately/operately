import React from "react";

export interface Context {
  editor: any;
  linkEditActive: boolean;
  setLinkEditActive: (active: boolean) => void;
}

export const EditorContext = React.createContext<Context>({} as Context);
