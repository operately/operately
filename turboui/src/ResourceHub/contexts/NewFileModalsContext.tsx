import * as React from "react";

import type { AddFileProps } from "../useAddFile";
import type { ResourceHubLinkType } from "../types";

export interface NewFileModalsContextValue extends AddFileProps {
  showAddFolder: boolean;
  toggleShowAddFolder: () => void;
  navigateToNewDocument: () => void;
  navigateToNewLink: (type?: ResourceHubLinkType) => void;
}

const Context = React.createContext<NewFileModalsContextValue | undefined>(undefined);

export function NewFileModalsProvider({
  value,
  children,
}: {
  value: NewFileModalsContextValue;
  children: React.ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNewFileModalsContext() {
  const context = React.useContext(Context);

  if (context === undefined) {
    throw new Error("useNewFileModalsContext must be used within a NewFileModalsProvider");
  }

  return context;
}
