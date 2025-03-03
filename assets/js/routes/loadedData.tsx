import React from "react";
import { useRouter } from "./Router";

interface LoadedDataContextValue {
  data: any;
  isPeekWindow: boolean;
}

const LoadedDataContext = React.createContext<LoadedDataContextValue | undefined>(undefined);

export function LoadedDataPageProvider({ children }) {
  const { loadedData } = useRouter();

  return (
    <LoadedDataContext.Provider value={{ data: loadedData, isPeekWindow: false }}>
      {children}
    </LoadedDataContext.Provider>
  );
}

export function LoadedDataPeekWindowProvider({ children }) {
  const { peekWindowData } = useRouter();

  return (
    <LoadedDataContext.Provider value={{ data: peekWindowData, isPeekWindow: true }}>
      {children}
    </LoadedDataContext.Provider>
  );
}

export function useLoadedData() {
  const context = React.useContext(LoadedDataContext);

  if (context === undefined) {
    throw new Error("useLoadedData must be used within a LoadedDataProvider");
  }

  return context.data;
}

export function useIsPeekWindow() {
  const context = React.useContext(LoadedDataContext);

  if (context === undefined) {
    throw new Error("useIsPeekWindow must be used within a LoadedDataProvider");
  }

  return context.isPeekWindow;
}
