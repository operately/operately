import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { IconArrowRight, IconMessage, IconMessages, IconPlus, IconX } from "../icons";

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "ai";
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationsProps {
  /**
   * Whether the conversations panel is open
   */
  isOpen: boolean;

  /**
   * Called when the panel should close
   */
  onClose: () => void;

  /**
   * Called when a new message is sent
   */
  onSendMessage?: (message: string, conversationId?: string) => Promise<void>;

  /**
   * List of previous conversations
   */
  conversations?: Conversation[];

  /**
   * Currently active conversation ID
   */
  activeConversationId?: string;

  /**
   * Called when a conversation is selected
   */
  onSelectConversation?: (conversationId: string) => void;

  /**
   * Called when a new conversation is created
   */
  onCreateConversation?: () => void;

  /**
   * Initial width of the panel in pixels
   */
  initialWidth?: number;

  /**
   * Minimum width of the panel in pixels
   */
  minWidth?: number;

  /**
   * Maximum width of the panel in pixels
   */
  maxWidth?: number;
}

export function Conversations({
  isOpen,
  onClose,
  onSendMessage,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
  initialWidth = 384, // 96 * 4 (w-96 equivalent)
  minWidth = 320, // Minimum usable width
  maxWidth = 600, // Maximum width
}: ConversationsProps) {
  const [mounted, setMounted] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get the active conversation
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages]);

  // Handle ESC key to close
  useEffect(() => {
    if (isOpen) {
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === "Escape" && !event.defaultPrevented) {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
    return undefined;
  }, [isOpen, onClose]);

  // Handle resize functionality
  useEffect(() => {
    if (!isResizing) return;

    // Prevent text selection during resize
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing, minWidth, maxWidth]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !onSendMessage) return;

    try {
      await onSendMessage(inputMessage, activeConversationId);
      setInputMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  if (!mounted || !isOpen) {
    return null;
  }

  const panelContent = (
    <div
      ref={panelRef}
      className="fixed inset-y-0 right-0 z-50 bg-surface-base border-l border-surface-outline shadow-xl flex flex-col"
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-all ${
          isResizing ? "bg-accent-base" : "hover:bg-accent-base/50 bg-surface-outline/50"
        }`}
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      >
        {/* Visual indicator */}
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-3 h-8 flex flex-col justify-center gap-1 pointer-events-none">
          <div className="w-0.5 h-0.5 bg-content-dimmed rounded-full" />
          <div className="w-0.5 h-0.5 bg-content-dimmed rounded-full" />
          <div className="w-0.5 h-0.5 bg-content-dimmed rounded-full" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-outline bg-surface-base">
        <div className="flex items-center gap-2">
          <IconMessages size={20} className="text-content-accent" />
          <h2 className="font-semibold text-content-accent">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-1">
          {/* Conversations List Toggle */}
          <button
            onClick={() => setShowConversationsList(!showConversationsList)}
            className="p-2 text-content-subtle hover:text-content-base hover:bg-surface-highlight rounded transition-colors"
            title="View conversations"
          >
            <IconMessage size={16} />
          </button>

          {/* New Conversation */}
          <button
            onClick={onCreateConversation}
            className="p-2 text-content-subtle hover:text-content-base hover:bg-surface-highlight rounded transition-colors"
            title="New conversation"
          >
            <IconPlus size={16} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-content-subtle hover:text-content-base hover:bg-surface-highlight rounded transition-colors"
            title="Close"
          >
            <IconX size={16} />
          </button>
        </div>
      </div>

      {/* Conversations List Overlay */}
      {showConversationsList && (
        <div className="absolute inset-0 z-10 bg-surface-base border-l border-surface-outline">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-outline">
            <h3 className="font-semibold text-content-accent">Conversations</h3>
            <button
              onClick={() => setShowConversationsList(false)}
              className="p-1 text-content-subtle hover:text-content-base hover:bg-surface-highlight rounded transition-colors"
            >
              <IconX size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-content-dimmed">
                <IconMessage size={32} className="mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      onSelectConversation?.(conversation.id);
                      setShowConversationsList(false);
                    }}
                    className={`w-full text-left p-3 rounded hover:bg-surface-highlight transition-colors ${
                      activeConversationId === conversation.id
                        ? "bg-surface-highlight border border-surface-outline"
                        : ""
                    }`}
                  >
                    <div className="font-medium text-content-base truncate">{conversation.title}</div>
                    <div className="text-sm text-content-dimmed mt-1">{conversation.messages.length} messages</div>
                    <div className="text-xs text-content-dimmed">{formatTime(conversation.updatedAt)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!activeConversation ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-content-dimmed">
            <IconMessages size={48} className="mb-4 opacity-50" />
            <h3 className="font-medium mb-2">Welcome to AI Assistant</h3>
            <p className="text-sm mb-4">Start a conversation to review your project and get AI assistance.</p>
            <button
              onClick={onCreateConversation}
              className="px-4 py-2 bg-accent-base text-white rounded hover:bg-accent-hover transition-colors"
            >
              Start New Conversation
            </button>
          </div>
        ) : (
          <>
            {activeConversation.messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.sender === "user" ? "bg-accent-base text-white" : "bg-surface-highlight text-content-base"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${message.sender === "user" ? "text-white/70" : "text-content-dimmed"}`}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {activeConversation && (
        <div className="border-t border-surface-outline p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none border border-surface-outline rounded px-3 py-2 text-sm bg-surface-base text-content-base placeholder-content-dimmed focus:outline-none focus:ring-2 focus:ring-accent-base focus:border-transparent"
              style={{
                minHeight: "38px",
                maxHeight: "120px",
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="px-3 py-2 bg-accent-base text-white rounded hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <IconArrowRight size={16} />
            </button>
          </div>
          <div className="text-xs text-content-dimmed mt-2">Press Enter to send, Shift+Enter for new line</div>
        </div>
      )}
    </div>
  );

  return createPortal(panelContent, document.body);
}

export default Conversations;

// Re-export the hook and types
export { useConversations } from "./useConversations";
export type { UseConversationsOptions, UseConversationsReturn } from "./useConversations";
