import * as React from "react";
import { Conversations, IconRobotFace, useConversations } from "turboui";
import { FloatingActionButton } from "turboui/src";

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

const context: Conversations.ContextAttachment = {
  id: "goal-q4-revenue",
  type: "goal",
  title: "Q4 Revenue Target: $500K",
  url: "/goals/q4-revenue",
};

export function AiSidebar() {
  const state = useConversations({});

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
        contextAttachment={context}
      />
    </>
  );
}
