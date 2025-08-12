import { useCallback, useState } from "react";
import type { Conversation, Message } from "./index";

export interface UseConversationsReturn {
  conversations: Conversation[];
  activeConversationId?: string;
  isOpen: boolean;

  // Actions
  openConversations: () => void;
  closeConversations: () => void;
  createConversation: () => void;
  selectConversation: (id: string) => void;
  updateConversationTitle: (id: string, newTitle: string) => void;
  sendMessage: (content: string, conversationId?: string, contextAttachment?: import('./index').ContextAttachment) => Promise<void>;

  // State
  isLoading: boolean;
  error?: string;
}

export interface UseConversationsOptions {
  /**
   * Function to send messages to AI service
   */
  onSendToAI?: (message: string, conversationHistory?: Message[]) => Promise<string | { content: string; actions?: import('./index').MessageAction[] }>;

  /**
   * Function to save conversations (e.g., to localStorage or server)
   */
  onSaveConversation?: (conversation: Conversation) => Promise<void>;

  /**
   * Function to load conversations (e.g., from localStorage or server)
   */
  onLoadConversations?: () => Promise<Conversation[]>;

  /**
   * Initial conversations to load
   */
  initialConversations?: Conversation[];
}

export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const { onSendToAI, onSaveConversation, onLoadConversations, initialConversations = [] } = options;

  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const openConversations = useCallback(() => {
    setIsOpen(true);
    setError(undefined);

    // Load conversations if loader is provided
    if (onLoadConversations) {
      setIsLoading(true);
      onLoadConversations()
        .then(setConversations)
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [onLoadConversations]);

  const closeConversations = useCallback(() => {
    setIsOpen(false);
  }, []);

  const createConversation = useCallback(() => {
    setActiveConversationId(undefined);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const updateConversationTitle = useCallback((id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, title: newTitle, updatedAt: new Date() } : conv))
    );
  }, []);

  const sendMessage = useCallback(
    async (content: string, conversationId?: string, _contextAttachment?: import('./index').ContextAttachment) => {
      setIsLoading(true);
      setError(undefined);

      try {
        const timestamp = new Date();
        const userMessage: Message = {
          id: `msg-${timestamp.getTime()}`,
          content,
          timestamp,
          sender: "user",
        };

        let targetConversationId = conversationId;
        let conversationHistory: Message[] = [];

        // If no conversation ID provided, create a new conversation
        if (!targetConversationId) {
          const newConversation: Conversation = {
            id: `conv-${timestamp.getTime()}`,
            title: "New Chat",
            messages: [userMessage],
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          setConversations((prev) => [newConversation, ...prev]);
          setActiveConversationId(newConversation.id);
          targetConversationId = newConversation.id;
          conversationHistory = [userMessage];
        } else {
          // Add message to existing conversation
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === targetConversationId) {
                const updatedConv = {
                  ...conv,
                  messages: [...conv.messages, userMessage],
                  updatedAt: timestamp,
                };
                conversationHistory = updatedConv.messages;
                return updatedConv;
              }
              return conv;
            }),
          );
        }

        // Get AI response if handler is provided
        if (onSendToAI) {
          const aiResponse = await onSendToAI(content, conversationHistory);
          const aiResponseContent = typeof aiResponse === 'string' ? aiResponse : aiResponse.content;
          const aiResponseActions = typeof aiResponse === 'object' ? aiResponse.actions : undefined;
          
          const aiMessage: Message = {
            id: `msg-${Date.now()}`,
            content: aiResponseContent,
            timestamp: new Date(),
            sender: "ai",
            actions: aiResponseActions,
          };

          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id === targetConversationId) {
                const updatedConv = {
                  ...conv,
                  messages: [...conv.messages, aiMessage],
                  updatedAt: new Date(),
                };

                // Save conversation if handler is provided
                if (onSaveConversation) {
                  onSaveConversation(updatedConv).catch(console.error);
                }

                return updatedConv;
              }
              return conv;
            }),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [onSendToAI, onSaveConversation],
  );

  return {
    conversations,
    activeConversationId,
    isOpen,
    isLoading,
    error,
    openConversations,
    closeConversations,
    createConversation,
    selectConversation,
    updateConversationTitle,
    sendMessage,
  };
}
