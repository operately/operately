import * as Companies from "@/models/companies";
import React from "react";
import { Conversations } from "turboui/dist/Conversations";
import { useCurrentCompany } from "../../contexts/CurrentCompanyContext";

interface AiSidebarContext {
  enabled: boolean;

  conversationContext: Conversations.ContextAttachment | null;
  setConversationContext: (context: Conversations.ContextAttachment | null) => void;
}

const AiSidebarContext = React.createContext<AiSidebarContext>({
  enabled: false,

  conversationContext: null,
  setConversationContext: () => {},
});

export function AiSidebarContextProvider({ children }: { children: React.ReactNode }) {
  const company = useCurrentCompany();
  const enabled = company !== null && Companies.hasFeature(company, "ai");

  const [conversationContext, setConversationContext] = React.useState<Conversations.ContextAttachment | null>(null);

  const ctx = {
    enabled,
    conversationContext,
    setConversationContext,
  };

  return <AiSidebarContext.Provider value={ctx}>{children}</AiSidebarContext.Provider>;
}

export function useAiSidebarContext() {
  return React.useContext(AiSidebarContext);
}
