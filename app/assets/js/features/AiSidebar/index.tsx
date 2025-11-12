import * as Time from "@/utils/time";
import * as React from "react";

import Api, { AgentConversation, AgentMessage } from "@/api";
import { useCurrentCompany, useMe } from "@/contexts/CurrentCompanyContext";

import { Conversations, FloatingActionButton, IconRobotFace } from "turboui";
import { useNewAgentMessageSignal } from "../../signals";
import { useAiSidebarContext } from "./context";

const AI_CONFIGURED = window.appConfig.aiConfigured;

interface AiSidebarProps {
  conversationContext: Conversations.ContextAttachment | null;
}

export function useAiSidebar(props: AiSidebarProps) {
  const ctx = useAiSidebarContext();

  React.useEffect(() => {
    ctx.setConversationContext(props.conversationContext);

    return () => {
      ctx.setConversationContext(null);
    };
  }, []);
}

export function AiSidebar() {
  const ctx = useAiSidebarContext();

  if (ctx.conversationContext) {
    return <AiSidebarElements />;
  } else {
    return null;
  }
}

function AiSidebarElements() {
  const state = useSidebarState();
  const me = useMe();
  const disabledMessage = AI_CONFIGURED
    ? undefined
    : "Ask Alfred isn't available because the AI integration hasn't been configured.";

  return (
    <>
      <FloatingActionButton
        icon={<IconRobotFace size={20} />}
        text="Ask Alfred"
        onClick={state.openSidebar}
        label={"Ask Alfred about this " + state.conversationContext?.type}
        variant="primary"
        position="bottom-right"
      />

      <Conversations
        isOpen={state.isOpen}
        onClose={state.closeSidebar}
        conversations={state.conversations}
        activeConversationId={state.activeConversationId}
        onSelectConversation={state.setActiveConversationId}
        onCreateConversation={state.createConvo}
        onSendMessage={state.sendMessage}
        contextActions={state.actions}
        disabledMessage={disabledMessage}
        contextAttachment={state.conversationContext!}
        me={me!}
        maxWidth={1000}
      />
    </>
  );
}

function prepareConvos(convos: AgentConversation[]): Conversations.Conversation[] {
  return convos.map((c) => prepareConvo(c));
}

function prepareConvo(c: AgentConversation): Conversations.Conversation {
  return {
    id: c.id,
    title: c.title,
    createdAt: Time.parseISO(c.createdAt),
    updatedAt: Time.parseISO(c.updatedAt),
    messages: c.messages.map((m) => prepareMessage(m)),
  };
}

function prepareMessage(message: AgentMessage): Conversations.Message {
  return {
    id: message.id,
    content: message.content,
    timestamp: Time.parseISO(message.timestamp),
    sender: message.sender,
    status: message.status as "pending" | "done",
  };
}

function useAvailableActions(conversationContext: Conversations.ContextAttachment | null) {
  const company = useCurrentCompany();

  return React.useMemo(() => {
    const allActions = window.appConfig.aiActions.filter((a) => a.context === conversationContext?.type);

    // Filter out experimental actions if the experimental AI feature is not enabled
    return allActions.filter((action) => {
      if (!action.experimental) return true;

      if (!company?.enabledExperimentalFeatures) return false;

      return company.enabledExperimentalFeatures.includes("experimental-ai");
    });
  }, [conversationContext?.type, company?.enabledExperimentalFeatures]);
}

function useSidebarState() {
  const ctx = useAiSidebarContext();
  const conversationContext = ctx.conversationContext;

  const actions = useAvailableActions(conversationContext);
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeConversationId, setActiveConversationId] = React.useState<string | undefined>(undefined);
  const [conversations, setConversations] = React.useState<Conversations.Conversation[]>([]);

  const openSidebar = React.useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSidebar = React.useCallback(() => {
    setIsOpen(false);
    setActiveConversationId(undefined);
  }, []);

  const refreshConversations = React.useCallback(() => {
    // Don't fetch conversations if AI is not configured
    if (!AI_CONFIGURED) {
      return;
    }

    const params: any = {};
    if (conversationContext) {
      params.contextType = conversationContext.type;
      params.contextId = conversationContext.id;
    }

    Api.ai.getConversations(params).then((data) => {
      const convos = prepareConvos(data.conversations);
      setConversations(convos);
    });
  }, [conversationContext]);

  const createConvo = React.useCallback(
    (action: Conversations.ContextAction | null) => {
      if (!action) return;
      if (!conversationContext) return;
      if (!AI_CONFIGURED) return;

      Api.ai
        .createConversation({
          actionId: action.id,
          contextType: conversationContext.type!,
          contextId: conversationContext.id!,
        })
        .then((data) => {
          const newConvo = prepareConvo(data.conversation);
          setConversations((prev) => [newConvo, ...prev]);
          setActiveConversationId(newConvo.id);
        });
    },
    [conversationContext],
  );

  const sendMessage = React.useCallback(
    async (message: string) => {
      if (!activeConversationId) return;
      if (!AI_CONFIGURED) return;

      try {
        const resp = await Api.ai.sendMessage({
          conversationId: activeConversationId,
          message: message,
        });

        const newMessage = prepareMessage(resp.message);

        setConversations((prev) => {
          const updated = prev.map((c) => {
            if (c.id === activeConversationId) {
              return {
                ...c,
                messages: [...c.messages, newMessage],
              };
            }
            return c;
          });

          return updated;
        });
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [activeConversationId],
  );

  // On component mount, load conversations
  React.useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // On new agent message signal, refresh conversations
  useNewAgentMessageSignal(refreshConversations, { convoId: activeConversationId! });

  return {
    isOpen,
    openSidebar,
    closeSidebar,
    activeConversationId,
    conversations,
    refreshConversations,
    setConversations,
    setActiveConversationId,
    createConvo,
    conversationContext,
    actions,
    sendMessage,
  };
}
