import React from "react";
import { Conversations, useConversations, type ContextAction, type ContextAttachment, type MessageAction } from "./index";

// Mock context data for a goal page
const mockGoalContext: ContextAttachment = {
  id: "goal-q4-revenue",
  type: "goal",
  title: "Q4 Revenue Target: $500K",
  url: "/goals/q4-revenue",
};

// Context-aware actions for goal page
const mockContextActions: ContextAction[] = [
  {
    id: "evaluate-definition",
    label: "Evaluate goal definition",
    prompt: "Please evaluate the definition and clarity of this goal. Is it well-structured, measurable, and achievable?",
    variant: "primary",
  },
  {
    id: "summarize-status",
    label: "Summarize current status",
    prompt: "Please provide a summary of the current status and progress toward this goal.",
    variant: "secondary",
  },
  {
    id: "on-track-analysis",
    label: "Are we on track?",
    prompt: "Based on current progress and timeline, are we on track to achieve this goal? What are the risks?",
    variant: "secondary",
  },
  {
    id: "identify-blockers",
    label: "Identify blockers",
    prompt: "What are the main blockers or challenges that could prevent us from achieving this goal?",
    variant: "secondary",
  },
];

/**
 * Example component showing how to integrate the Conversations component
 * into a real application with AI integration and context-aware actions
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
    // Example AI integration with context-aware responses
    onSendToAI: async (message, _conversationHistory) => {
      // This would be replaced with actual AI service call
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay

      let response = "";
      let actions: MessageAction[] = [];

      // Context-aware responses based on predefined actions
      if (message.includes("evaluate the definition and clarity")) {
        response = `**Goal Definition Analysis for "${mockGoalContext.title}"**\n\nStrengths:\n• Clear monetary target ($500K)\n• Specific timeframe (Q4)\n• Measurable outcome\n\nAreas for improvement:\n• Could benefit from more specific success metrics\n• Missing breakdown of how to achieve this target\n• No mention of responsible team members\n\nRecommendation: Consider adding 2-3 key milestones and assigning ownership to make this goal more actionable.`;
        actions = [
          {
            id: "post-to-goal",
            label: "Post this analysis to goal page",
            variant: "primary",
            onClick: () => alert("This would post the analysis to the goal page"),
          },
          {
            id: "schedule-review",
            label: "Schedule monthly review",
            variant: "secondary",
            onClick: () => alert("This would schedule a recurring review"),
          },
        ];
      } else if (message.includes("summary of the current status")) {
        response = `**Current Status Summary for "${mockGoalContext.title}"**\n\n📊 Progress: $187K achieved (37.4% of target)\n📅 Time remaining: 45 days in Q4\n⚠️  Risk level: Moderate\n\nKey metrics:\n• Monthly run rate: $62K (need $104K avg for remaining months)\n• Pipeline: $245K in qualified opportunities\n• Team capacity: 85% utilized\n\nNext actions needed: Focus on converting pipeline opportunities and consider resource reallocation.`;
        actions = [
          {
            id: "update-goal",
            label: "Update goal with this status",
            variant: "primary",
            onClick: () => alert("This would update the goal status"),
          },
        ];
      } else if (message.includes("are we on track to achieve")) {
        response = `**On-Track Analysis for "${mockGoalContext.title}"**\n\n🔴 **Currently behind target**\n\nCurrent trajectory: $420K projected (84% of goal)\nGap to close: $80K\n\nMain risks:\n• Q4 seasonality affecting close rates\n• Two key team members on vacation in December\n• Economic headwinds impacting deal sizes\n\nMitigation strategies:\n• Accelerate Q3 pipeline conversion\n• Consider temporary resource augmentation\n• Focus on higher-value opportunities`;
        actions = [
          {
            id: "create-action-plan",
            label: "Create mitigation action plan",
            variant: "primary",
            onClick: () => alert("This would create an action plan"),
          },
          {
            id: "alert-stakeholders",
            label: "Alert key stakeholders",
            variant: "secondary",
            onClick: () => alert("This would send alerts to stakeholders"),
          },
        ];
      } else if (message.includes("main blockers or challenges")) {
        response = `**Blocker Analysis for "${mockGoalContext.title}"**\n\n🚫 **Top 3 Blockers:**\n\n1. **Lead qualification bottleneck**\n   - Marketing leads have 23% lower conversion rate\n   - Sales team spending too much time on unqualified prospects\n\n2. **Pricing pressure**\n   - Average deal size down 15% from Q3\n   - Competitors offering aggressive discounts\n\n3. **Resource constraints**\n   - Implementation team at capacity\n   - Causing longer sales cycles\n\nImmediate actions: Improve lead scoring, review pricing strategy, consider implementation partnerships.`;
        actions = [
          {
            id: "assign-blockers",
            label: "Assign blocker owners",
            variant: "primary",
            onClick: () => alert("This would assign owners to each blocker"),
          },
        ];
      } else {
        // Generic responses for other messages
        if (message.toLowerCase().includes("project structure")) {
          response = "Your project appears to be well-organized with a clear component structure. I can see you're using TurboUI with components like Modal, Avatar, Button, and many others. Would you like me to analyze any specific aspect of the architecture?";
        } else if (message.toLowerCase().includes("component")) {
          response = "I can help you with component development! Based on your TurboUI library, I notice you follow consistent patterns with TypeScript interfaces, proper prop definitions, and Tailwind CSS styling. What specific component would you like to work on?";
        } else {
          response = `I understand you're asking about: "${message}". As Alfred, your AI COO, I can help with goal analysis, project review, strategic decisions, and more. How can I assist you today?`;
        }
      }

      // Return response with actions if any
      return { content: response, actions };
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
          <div className="bg-surface-highlight p-6 rounded-lg border border-surface-outline">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent-base rounded-full flex items-center justify-center text-white font-bold text-sm">
                A
              </div>
              <div className="flex-1">
                <h2 className="font-semibold mb-1">Alfred - Your AI COO</h2>
                <p className="text-sm text-content-dimmed mb-3">
                  I have access to your current goal "Q4 Revenue Target: $500K" and can help you with context-aware analysis and recommendations.
                </p>
                <button
                  onClick={openConversations}
                  className="px-4 py-2 bg-accent-base text-white rounded hover:bg-accent-hover transition-colors"
                >
                  Open Alfred
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface-base border border-surface-outline p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Current Context</h3>
            <div className="flex items-center gap-3 p-3 bg-surface-highlight rounded border border-surface-outline">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div>
                <div className="font-medium text-sm">{mockGoalContext.title}</div>
                <div className="text-xs text-content-dimmed">Goal • Active</div>
              </div>
            </div>
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
        onSendMessage={(message, conversationId) => sendMessage(message, conversationId, mockGoalContext)}
        contextActions={mockContextActions}
        contextAttachment={mockGoalContext}
      />
    </div>
  );
}

export default ConversationsExample;
