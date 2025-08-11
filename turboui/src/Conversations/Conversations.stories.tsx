import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { ConversationsExample } from "./ConversationsExample";
import { Conversations, type Conversation, type Message, type ContextAction, type ContextAttachment, type MessageAction } from "./index";

const meta: Meta<typeof Conversations> = {
  title: "Components/Conversations",
  component: Conversations,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock context data
const mockGoalContext: ContextAttachment = {
  id: "goal-q4-revenue",
  type: "goal",
  title: "Q4 Revenue Target: $500K",
  url: "/goals/q4-revenue",
};

const mockProjectContext: ContextAttachment = {
  id: "project-redesign",
  type: "project",
  title: "Website Redesign Project",
  url: "/projects/redesign",
};

// Context actions
const mockGoalActions: ContextAction[] = [
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
    prompt: "Based on current progress and timeline, are we on track to achieve this goal?",
    variant: "secondary",
  },
];

// Mock data with message actions
const mockMessages: Message[] = [
  {
    id: "1",
    content:
      "Please evaluate the definition and clarity of this goal. Is it well-structured, measurable, and achievable?",
    timestamp: new Date(Date.now() - 300000),
    sender: "user",
  },
  {
    id: "2",
    content:
      "**Goal Definition Analysis for \"Q4 Revenue Target: $500K\"**\n\nStrengths:\n• Clear monetary target ($500K)\n• Specific timeframe (Q4)\n• Measurable outcome\n\nAreas for improvement:\n• Could benefit from more specific success metrics\n• Missing breakdown of how to achieve this target\n• No mention of responsible team members\n\nRecommendation: Consider adding 2-3 key milestones and assigning ownership to make this goal more actionable.",
    timestamp: new Date(Date.now() - 280000),
    sender: "ai",
    actions: [
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
    ],
  },
  {
    id: "3",
    content: "That's very helpful! Can you also summarize the current status?",
    timestamp: new Date(Date.now() - 260000),
    sender: "user",
  },
  {
    id: "4",
    content:
      "**Current Status Summary for \"Q4 Revenue Target: $500K\"**\n\n📊 Progress: $187K achieved (37.4% of target)\n📅 Time remaining: 45 days in Q4\n⚠️  Risk level: Moderate\n\nKey metrics:\n• Monthly run rate: $62K (need $104K avg for remaining months)\n• Pipeline: $245K in qualified opportunities\n• Team capacity: 85% utilized\n\nNext actions needed: Focus on converting pipeline opportunities and consider resource reallocation.",
    timestamp: new Date(Date.now() - 240000),
    sender: "ai",
    actions: [
      {
        id: "update-goal",
        label: "Update goal with this status",
        variant: "primary",
        onClick: () => alert("This would update the goal status"),
      },
    ],
  },
];

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Q4 Revenue Goal Analysis",
    messages: mockMessages,
    createdAt: new Date(Date.now() - 400000),
    updatedAt: new Date(Date.now() - 240000),
    context: mockGoalContext,
  },
  {
    id: "conv-2",
    title: "Website Redesign Status",
    messages: [
      {
        id: "msg-1",
        content: "Please provide a status update on the website redesign project.",
        timestamp: new Date(Date.now() - 180000),
        sender: "user",
      },
      {
        id: "msg-2",
        content: "**Project Status Update for \"Website Redesign\"**\n\n🎯 Overall Progress: 65% complete\n📅 Timeline: On track for December launch\n👥 Team: 4 designers, 3 developers\n\nCompleted:\n• User research and wireframes\n• Visual design system\n• Component library foundation\n\nIn Progress:\n• Frontend development (80% done)\n• Content migration\n• QA testing\n\nUpcoming:\n• Final review and approval\n• Launch preparation",
        timestamp: new Date(Date.now() - 160000),
        sender: "ai",
        actions: [
          {
            id: "schedule-stakeholder-update",
            label: "Schedule stakeholder update",
            variant: "primary",
            onClick: () => alert("This would schedule a stakeholder update meeting"),
          },
        ],
      },
    ],
    createdAt: new Date(Date.now() - 200000),
    updatedAt: new Date(Date.now() - 160000),
    context: mockProjectContext,
  },
  {
    id: "conv-3",
    title: "General Discussion",
    messages: [
      {
        id: "msg-3",
        content: "How can I improve team productivity?",
        timestamp: new Date(Date.now() - 120000),
        sender: "user",
      },
    ],
    createdAt: new Date(Date.now() - 120000),
    updatedAt: new Date(Date.now() - 120000),
  },
];

// Template component for stories
function ConversationsStory(args: any) {
  const [isOpen, setIsOpen] = useState(args.isOpen);
  const [conversations, setConversations] = useState<Conversation[]>(args.conversations || []);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(args.activeConversationId);

  const handleSendMessage = async (message: string, conversationId?: string) => {
    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: message,
      timestamp: new Date(),
      sender: "user",
    };

    let aiResponseContent = `I understand you said: "${message}". This is a simulated AI response for the Storybook demo.`;
    let aiResponseActions: MessageAction[] = [];

    // Add context-aware responses for demo
    if (message.includes("evaluate") || message.includes("definition")) {
      aiResponseContent = `**Analysis Complete**\n\nI've evaluated the request: "${message}"\n\nThis appears to be a context-aware action that would normally provide detailed analysis based on the attached goal or project data.`;
      aiResponseActions = [
        {
          id: "demo-action-1",
          label: "Take follow-up action",
          variant: "primary",
          onClick: () => alert("This would perform a follow-up action"),
        },
        {
          id: "demo-action-2",
          label: "Share analysis",
          variant: "secondary",
          onClick: () => alert("This would share the analysis"),
        },
      ];
    }

    const aiResponse: Message = {
      id: `msg-${Date.now() + 1}`,
      content: aiResponseContent,
      timestamp: new Date(Date.now() + 1000),
      sender: "ai",
      actions: aiResponseActions.length > 0 ? aiResponseActions : undefined,
    };

    setConversations((prev) => {
      if (conversationId) {
        // Add to existing conversation
        return prev.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, newMessage, aiResponse],
                updatedAt: new Date(),
              }
            : conv,
        );
      } else {
        // Create new conversation
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
          messages: [newMessage, aiResponse],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setActiveConversationId(newConv.id);
        return [newConv, ...prev];
      }
    });
  };

  const handleCreateConversation = () => {
    setActiveConversationId(undefined);
  };

  return (
    <div className="h-screen bg-surface-base">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Conversations Component Demo</h1>
        <p className="text-content-dimmed mb-4">This component provides an AI chat interface for project assistance.</p>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-accent-base text-white rounded hover:bg-accent-hover transition-colors"
        >
          Open Conversations
        </button>
      </div>

      <Conversations
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onCreateConversation={handleCreateConversation}
        onSendMessage={handleSendMessage}
        contextActions={args.contextActions}
        contextAttachment={args.contextAttachment}
        initialWidth={args.initialWidth}
        minWidth={args.minWidth}
        maxWidth={args.maxWidth}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <ConversationsStory isOpen={false} conversations={[]} />,
};

export const WithConversations: Story = {
  render: () => <ConversationsStory isOpen={true} conversations={mockConversations} activeConversationId="conv-1" />,
};

export const ContextAwareGoal: Story = {
  render: () => (
    <ConversationsStory 
      isOpen={true} 
      conversations={[]} 
      contextActions={mockGoalActions}
      contextAttachment={mockGoalContext}
    />
  ),
};

export const WithMessageActions: Story = {
  render: () => (
    <ConversationsStory 
      isOpen={true} 
      conversations={mockConversations} 
      activeConversationId="conv-1"
      contextAttachment={mockGoalContext}
    />
  ),
};

export const EmptyState: Story = {
  render: () => <ConversationsStory isOpen={true} conversations={[]} />,
};

export const EmptyStateWithContext: Story = {
  render: () => (
    <ConversationsStory 
      isOpen={true} 
      conversations={[]} 
      contextActions={mockGoalActions}
      contextAttachment={mockGoalContext}
    />
  ),
};

export const ConversationsList: Story = {
  render: () => <ConversationsStory isOpen={true} conversations={mockConversations} />,
};

export const ResizablePanel: Story = {
  render: () => (
    <div className="h-screen bg-surface-base">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Resizable Conversations Panel</h1>
        <p className="text-content-dimmed mb-4">
          Drag the left edge of the panel to resize it. The panel respects minimum and maximum width constraints.
        </p>
        <div className="bg-surface-highlight p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Resize Instructions:</h3>
          <ul className="text-sm text-content-dimmed space-y-1">
            <li>• Hover over the left edge to see the resize cursor</li>
            <li>• Drag to adjust the panel width</li>
            <li>• Minimum width: 320px</li>
            <li>• Maximum width: 600px</li>
          </ul>
        </div>
      </div>
      <ConversationsStory
        isOpen={true}
        conversations={mockConversations}
        activeConversationId="conv-1"
        contextAttachment={mockGoalContext}
        initialWidth={450}
        minWidth={300}
        maxWidth={700}
      />
    </div>
  ),
};

export const GoalPageSimulation: Story = {
  render: () => (
    <div className="h-screen bg-surface-base">
      <div className="p-8 pr-96">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-2">Q4 Revenue Target: $500K</h1>
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Active Goal</span>
            <span className="text-content-dimmed">Due: Dec 31, 2024</span>
          </div>
          
          <div className="bg-surface-highlight p-6 rounded-lg mb-6">
            <h3 className="font-semibold mb-3">Progress Overview</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent-base">$187K</div>
                <div className="text-sm text-content-dimmed">Current</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">37.4%</div>
                <div className="text-sm text-content-dimmed">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">45 days</div>
                <div className="text-sm text-content-dimmed">Remaining</div>
              </div>
            </div>
          </div>
          
          <div className="bg-surface-base border border-surface-outline p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">AI COO Assistant</h3>
              <button 
                onClick={() => alert('This would open Alfred with context')}
                className="px-4 py-2 bg-accent-base text-white rounded hover:bg-accent-hover transition-colors"
              >
                Ask Alfred
              </button>
            </div>
            <p className="text-sm text-content-dimmed">
              Get context-aware analysis and recommendations for this goal. Alfred has access to all goal data, metrics, and timeline.
            </p>
          </div>
        </div>
      </div>
      
      <ConversationsStory
        isOpen={true}
        conversations={[]}
        contextActions={mockGoalActions}
        contextAttachment={mockGoalContext}
        initialWidth={400}
      />
    </div>
  ),
};

export const FullExample: Story = {
  render: () => <ConversationsExample />,
};
