import React from "react";
import { GoalPage } from ".";

import Conversations, { Conversation } from "../Conversations";

export function GoalConversations(props: GoalPage.State) {
  if (!props.aiState.enabled) {
    return null; // AI is not enabled, do not render conversations
  }

  return (
    <Conversations
      isOpen={props.aiState.isOpen}
      onClose={() => props.aiState.close()}
      onSendMessage={async (message, conversationId) => {
        console.log("Sending message:", message, "to conversation:", conversationId);
      }}
      conversations={props.aiState.conversations}
      activeConversationId={props.aiState.activeConversationId}
      onSelectConversation={undefined}
      onCreateConversation={undefined}
      initialWidth={500}
      minWidth={500}
      maxWidth={800}
    />
  );
}

export interface AiState {
  enabled: boolean;
  isOpen: boolean;
  startNewReview: () => void;
  conversations: Conversation[];
  activeConversationId: string;
  close: () => void;
}

export function useAiState(props: GoalPage.Props): AiState {
  const [isOpen, setIsOpen] = React.useState(false);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = React.useState<string>("");

  const startNewReview = () => {
    setIsOpen(true);

    const newConversation: Conversation = {
      id: `review-${Date.now()}`,
      title: "Goal Review",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    props.ai.startNewReview({ convoId: newConversation.id });
  };

  const close = () => {
    setIsOpen(false);
    setActiveConversationId("");
  };

  React.useEffect(() => {
    if (!props.ai.enabled || !isOpen || activeConversationId == "") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const messages = await props.ai.getConversationMessages({ convoRequestId: activeConversationId });
        setConversations((prev) => prev.map((c) => (c.id === activeConversationId ? { ...c, messages } : c)));
      } catch (e) {
        console.error("Error fetching conversation messages:", e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [props.ai.enabled, isOpen, activeConversationId]);

  return {
    enabled: props.ai.enabled,
    isOpen,
    startNewReview,
    conversations,
    activeConversationId,
    close,
  };
}
