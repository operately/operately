import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";

import { ConversationsExample } from "./ConversationsExample";
import { Conversations, type Conversation, type Message } from "./index";

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

// Mock data
const mockMessages: Message[] = [
  {
    id: "1",
    content:
      "Hello! I'd like to review my project structure. Can you help me understand how the components are organized?",
    timestamp: new Date(Date.now() - 300000),
    sender: "user",
  },
  {
    id: "2",
    content:
      "Of course! I'd be happy to help you understand your project structure. Based on what I can see, you have a well-organized TurboUI component library. Would you like me to walk through the different types of components you have?",
    timestamp: new Date(Date.now() - 280000),
    sender: "ai",
  },
  {
    id: "3",
    content: "Yes, that would be great! I'm particularly interested in the form components.",
    timestamp: new Date(Date.now() - 260000),
    sender: "user",
  },
  {
    id: "4",
    content:
      "Perfect! You have several form-related components:\n\n1. **TextField** - For text input\n2. **DateField** - For date selection\n3. **PrivacyField** - For privacy settings\n4. **SpaceField** - For space selection\n\nEach component follows consistent patterns with proper TypeScript types and Tailwind styling. Would you like me to explain any specific component in detail?",
    timestamp: new Date(Date.now() - 240000),
    sender: "ai",
  },
];

const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Project Structure Review",
    messages: mockMessages,
    createdAt: new Date(Date.now() - 400000),
    updatedAt: new Date(Date.now() - 240000),
  },
  {
    id: "conv-2",
    title: "Component API Design",
    messages: [
      {
        id: "msg-1",
        content: "How should I design the API for a new component?",
        timestamp: new Date(Date.now() - 180000),
        sender: "user",
      },
      {
        id: "msg-2",
        content: "Great question! For TurboUI components, I recommend following these patterns...",
        timestamp: new Date(Date.now() - 160000),
        sender: "ai",
      },
    ],
    createdAt: new Date(Date.now() - 200000),
    updatedAt: new Date(Date.now() - 160000),
  },
  {
    id: "conv-3",
    title: "Testing Strategy",
    messages: [
      {
        id: "msg-3",
        content: "What's the best approach for testing these components?",
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
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: message,
      timestamp: new Date(),
      sender: "user",
    };

    const aiResponse: Message = {
      id: `msg-${Date.now() + 1}`,
      content: `I understand you said: "${message}". This is a simulated AI response for the Storybook demo.`,
      timestamp: new Date(Date.now() + 1000),
      sender: "ai",
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

export const EmptyState: Story = {
  render: () => <ConversationsStory isOpen={true} conversations={[]} />,
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
        initialWidth={450}
        minWidth={300}
        maxWidth={700}
      />
    </div>
  ),
};

export const FullExample: Story = {
  render: () => <ConversationsExample />,
};
