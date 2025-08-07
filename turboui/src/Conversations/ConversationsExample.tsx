import React from "react";
import { Conversations, useConversations } from "./index";

/**
 * Example component showing how to integrate the Conversations component
 * into a real application with AI integration
 */
export function ConversationsExample() {
  const {
    conversations,
    activeConversationId,
    isOpen,
    isLoading,
    error,
    openConversations,
    closeConversations,
    createConversation,
    selectConversation,
    sendMessage,
  } = useConversations({
    // Example AI integration
    onSendToAI: async (message, _conversationHistory) => {
      // This would be replaced with actual AI service call
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API delay

      // Simple mock responses based on message content
      if (message.toLowerCase().includes("project structure")) {
        return "Your project appears to be well-organized with a clear component structure. I can see you're using TurboUI with components like Modal, Avatar, Button, and many others. Would you like me to analyze any specific aspect of the architecture?";
      }

      if (message.toLowerCase().includes("component")) {
        return "I can help you with component development! Based on your TurboUI library, I notice you follow consistent patterns with TypeScript interfaces, proper prop definitions, and Tailwind CSS styling. What specific component would you like to work on?";
      }

      if (message.toLowerCase().includes("test")) {
        return "For testing TurboUI components, I recommend using Jest with React Testing Library. You already have Jest configured. Would you like me to help you write tests for a specific component?";
      }

      return `I understand you're asking about: "${message}". As an AI assistant for your project, I can help with code review, architecture decisions, component development, testing strategies, and more. How can I assist you today?`;
    },

    // Example persistence (localStorage)
    onSaveConversation: async (conversation) => {
      const saved = JSON.parse(localStorage.getItem("turboui-conversations") || "[]");
      const updated = saved.filter((c: any) => c.id !== conversation.id);
      updated.unshift(conversation);
      localStorage.setItem("turboui-conversations", JSON.stringify(updated.slice(0, 10))); // Keep last 10
    },

    onLoadConversations: async () => {
      const saved = localStorage.getItem("turboui-conversations");
      return saved ? JSON.parse(saved) : [];
    },
  });

  return (
    <div className="relative">
      {/* Main application content */}
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">TurboUI Project</h1>
        <p className="text-content-dimmed mb-6">Your component library with AI assistance</p>

        <div className="space-y-4">
          <div className="bg-surface-highlight p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Need Help?</h2>
            <p className="text-sm text-content-dimmed mb-3">
              Get AI assistance for project review, component development, and architecture decisions.
            </p>
            <button
              onClick={openConversations}
              className="px-4 py-2 bg-accent-base text-white rounded hover:bg-accent-hover transition-colors"
            >
              Open AI Assistant
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {isLoading && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">AI is thinking...</div>
          )}
        </div>
      </div>

      {/* Conversations overlay */}
      <Conversations
        isOpen={isOpen}
        onClose={closeConversations}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onCreateConversation={createConversation}
        onSendMessage={sendMessage}
      />
    </div>
  );
}

export default ConversationsExample;
