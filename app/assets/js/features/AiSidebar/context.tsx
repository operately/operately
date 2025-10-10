import React from "react";
import { Conversations } from "turboui/dist/Conversations";

interface AiSidebarContext {
  conversationContext: Conversations.ContextAttachment | null;
  setConversationContext: (context: Conversations.ContextAttachment | null) => void;
}

const AiSidebarContext = React.createContext<AiSidebarContext>({
  conversationContext: null,
  setConversationContext: () => {},
});

export function AiSidebarContextProvider({ children }: { children: React.ReactNode }) {
  const [conversationContext, setConversationContext] = React.useState<Conversations.ContextAttachment | null>(null);

  const ctx = {
    conversationContext,
    setConversationContext,
  };

  return <AiSidebarContext.Provider value={ctx}>{children}</AiSidebarContext.Provider>;
}

export function useAiSidebarContext() {
  return React.useContext(AiSidebarContext);
}
