import React from "react";

export interface SupportSessionDetails {
  company: {
    id: string;
    name: string;
    shortId: string;
    path: string;
  };
  person: {
    id: string;
    fullName: string;
  };
  startedAt: string;
  endPath: string;
}

interface SupportSessionContextValue {
  active: boolean;
  session?: SupportSessionDetails & { startedAtDate: Date };
}

const SupportSessionContext = React.createContext<SupportSessionContextValue>({ active: false });

interface SupportSessionProviderProps {
  children: React.ReactNode;
  config?: SupportSessionDetails;
}

export function SupportSessionProvider({ children, config }: SupportSessionProviderProps) {
  const value = React.useMemo<SupportSessionContextValue>(() => {
    if (!config) {
      return { active: false };
    }

    return {
      active: true,
      session: {
        ...config,
        startedAtDate: new Date(config.startedAt),
      },
    };
  }, [config]);

  return <SupportSessionContext.Provider value={value}>{children}</SupportSessionContext.Provider>;
}

export function useSupportSession(): SupportSessionContextValue {
  return React.useContext(SupportSessionContext);
}
