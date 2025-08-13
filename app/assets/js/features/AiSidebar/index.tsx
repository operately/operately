import * as Time from "@/utils/time";
import * as React from "react";

import Api from "@/api";

import { Conversations, FloatingActionButton, IconRobotFace, useConversations } from "turboui";
import { useAiSidebarContext } from "./context";

const actions: Conversations.ContextAction[] = [
  {
    id: "evaluate-definition",
    label: "Evaluate goal definition",
    prompt:
      "Please evaluate the definition and clarity of this goal. Is it well-structured, measurable, and achievable?",
  },
  {
    id: "summarize-status",
    label: "Summarize current status",
    prompt: "Please provide a summary of the current status and progress toward this goal.",
  },
  {
    id: "on-track-analysis",
    label: "Are we on track?",
    prompt: "Based on current progress and timeline, are we on track to achieve this goal? What are the risks?",
  },
  {
    id: "identify-blockers",
    label: "Identify blockers",
    prompt: "What are the main blockers or challenges that could prevent us from achieving this goal?",
  },
];

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

  const state = useConversations({
    onLoadConversations: async () => {
      const data = await Api.ai.getConversations({});

      return data.conversations.map((c) => ({
        id: c.id,
        title: c.title,
        createdAt: Time.parseISO(c.createdAt),
        updatedAt: Time.parseISO(c.updatedAt),
        messages: c.messages.map((m) => ({
          id: m.id,
          content: m.content,
          timestamp: Time.parseISO(m.timestamp),
          sender: "ai",
        })),
      }));
    },
  });

  return (
    <>
      <FloatingActionButton
        icon={<IconRobotFace size={20} />}
        text="Ask Alfred"
        onClick={state.openConversations}
        label="Ask Alfred about this goal"
        variant="primary"
        position="bottom-right"
      />

      <Conversations
        isOpen={state.isOpen}
        onClose={state.closeConversations}
        conversations={state.conversations}
        activeConversationId={state.activeConversationId}
        onSelectConversation={state.selectConversation}
        onCreateConversation={state.createConversation}
        onSendMessage={state.sendMessage}
        onUpdateConversationTitle={state.updateConversationTitle}
        contextActions={actions}
        contextAttachment={conversationContext!}
      />
    </>
  );
}
