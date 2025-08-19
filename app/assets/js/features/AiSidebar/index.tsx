import * as Time from "@/utils/time";
import * as React from "react";

import Api, { AgentConversation, AgentMessage } from "@/api";

import { Conversations, FloatingActionButton, IconRobotFace } from "turboui";
import { useNewAgentMessageSignal } from "../../signals";
import { useAiSidebarContext } from "./context";

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

  if (ctx.enabled && ctx.conversationContext) {
    return <AiSidebarElements />;
  } else {
    return null;
  }
}

function AiSidebarElements() {
  const ctx = useAiSidebarContext();
  const conversationContext = ctx.conversationContext;

  const [isOpen, setIsOpen] = React.useState(false);
  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => {
    setIsOpen(false);
    setActiveConversationId(undefined);
  };

  const [activeConversationId, setActiveConversationId] = React.useState<string | undefined>(undefined);
  const [conversations, setConversations] = React.useState<Conversations.Conversation[]>([]);

  const refreshConversations = React.useCallback(() => {
    Api.ai.getConversations({}).then((data) => {
      const convos = prepareConvos(data.conversations);
      setConversations(convos);
    });
  }, []);

  React.useEffect(() => {
    refreshConversations();
  }, []);

  const actions = React.useMemo(
    () => window.appConfig.aiActions.filter((a) => a.context === conversationContext?.type),
    [conversationContext],
  );

  useNewAgentMessageSignal(refreshConversations, { convoId: activeConversationId! });

  const createConvo = useCreateConvo({
    setConversations,
    setActiveConversationId,
  });

  const sendMessage = useSendMessage({ activeConversationId, setConversations });

  return (
    <>
      <FloatingActionButton
        icon={<IconRobotFace size={20} />}
        text="Ask Alfred"
        onClick={openSidebar}
        label="Ask Alfred about this goal"
        variant="primary"
        position="bottom-right"
      />

      <Conversations
        isOpen={isOpen}
        onClose={closeSidebar}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onCreateConversation={createConvo}
        onSendMessage={sendMessage}
        contextActions={actions}
        contextAttachment={conversationContext!}
        maxWidth={1000}
      />
    </>
  );
}

function useCreateConvo({
  setConversations,
  setActiveConversationId,
}: {
  setConversations: React.Dispatch<React.SetStateAction<Conversations.Conversation[]>>;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
}) {
  const ctx = useAiSidebarContext();
  const conversationContext = ctx.conversationContext;

  return React.useCallback((action: Conversations.ContextAction | null) => {
    if (!action) return;
    if (!conversationContext) return;

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
  }, []);
}

function useSendMessage({
  setConversations,
  activeConversationId,
}: {
  setConversations: React.Dispatch<React.SetStateAction<Conversations.Conversation[]>>;
  activeConversationId: string | undefined;
}) {
  return React.useCallback(
    async (message: string) => {
      if (!activeConversationId) return;

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
  };
}
