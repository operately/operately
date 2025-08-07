# GoalPage AI Integration

The GoalPage component now supports AI-powered goal review through the integrated Conversations component.

## Features

- **"Review this goal" action** in the sidebar action list
- **Context-aware AI responses** based on goal data
- **Persistent conversation history** with goal-specific storage
- **Intelligent responses** about progress, checklists, targets, and metrics

## Usage

### Basic Integration

```tsx
import { GoalPage } from "turboui";
import { Conversations, useConversations } from "turboui";

function MyGoalPage() {
  const {
    conversations,
    activeConversationId,
    isOpen,
    openConversations,
    closeConversations,
    createConversation,
    selectConversation,
    sendMessage,
  } = useConversations({
    onSendToAI: async (message, conversationHistory) => {
      // Your AI service integration
      const response = await myAIService.chat(message, {
        goalContext: goal,
        conversationHistory,
      });
      return response;
    },
  });

  const handleReviewGoal = () => {
    openConversations();
  };

  return (
    <>
      <GoalPage {...goalProps} onReviewGoal={handleReviewGoal} />

      <Conversations
        isOpen={isOpen}
        onClose={closeConversations}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={selectConversation}
        onCreateConversation={createConversation}
        onSendMessage={sendMessage}
      />
    </>
  );
}
```

### Advanced Integration with Goal Context

```tsx
const {
  conversations,
  activeConversationId,
  isOpen,
  openConversations,
  closeConversations,
  createConversation,
  selectConversation,
  sendMessage,
} = useConversations({
  onSendToAI: async (message, conversationHistory) => {
    // Build context from goal data
    const goalContext = {
      name: goal.name,
      status: goal.status,
      progress: calculateProgress(goal),
      targets: goal.targets,
      checklistItems: goal.checklistItems,
      dueDate: goal.dueDate,
      champion: goal.champion,
      reviewer: goal.reviewer,
    };

    const response = await aiService.reviewGoal({
      message,
      goalContext,
      conversationHistory,
      systemPrompt: `You are an AI assistant helping to review and optimize goals. 
        Analyze the goal progress, provide insights, and suggest improvements based on the current data.`,
    });

    return response;
  },

  onSaveConversation: async (conversation) => {
    // Save with goal-specific context
    await api.saveConversation({
      ...conversation,
      goalId: goal.id,
      goalName: goal.name,
    });
  },

  onLoadConversations: async () => {
    // Load goal-specific conversations
    return await api.getGoalConversations(goal.id);
  },
});
```

## AI Response Examples

The AI can provide intelligent responses about various aspects of the goal:

### Progress Analysis

- Analyze completion percentages
- Identify bottlenecks and risks
- Suggest timeline adjustments

### Checklist Optimization

- Review task prioritization
- Suggest additional tasks
- Identify dependencies

### Target Review

- Assess metric feasibility
- Recommend target adjustments
- Compare against benchmarks

### Strategic Insights

- Alignment with company objectives
- Resource allocation recommendations
- Risk mitigation strategies

## Action Location

The "Review this goal" action appears in the sidebar action list when `onReviewGoal` is provided:

- **Location**: Sidebar > Actions section
- **Icon**: Messages icon
- **Visibility**: Only when `onReviewGoal` callback is provided
- **Position**: Top of the action list

## Customization

### Custom AI Prompts

```tsx
const systemPrompts = {
  general: "You are a goal optimization expert...",
  progress: "Focus on analyzing progress and timeline...",
  risks: "Identify potential risks and mitigation strategies...",
  strategy: "Provide strategic recommendations...",
};

const onSendToAI = async (message, history) => {
  const prompt = determinePromptType(message);
  return await aiService.chat(message, {
    systemPrompt: systemPrompts[prompt],
    goalContext: goal,
    history,
  });
};
```

### Custom Storage

```tsx
const onSaveConversation = async (conversation) => {
  // Custom storage implementation
  await myStorage.save(`goal-${goalId}-conversations`, conversation);
};

const onLoadConversations = async () => {
  // Custom loading implementation
  return await myStorage.load(`goal-${goalId}-conversations`);
};
```

## Testing

The Storybook stories include a working example with simulated AI responses:

- **WithAIAssistant**: Full integration example
- **Default**: Basic goal page with AI review action

## Dependencies

- React 18+
- TurboUI Conversations component
- AI service of your choice (OpenAI, Anthropic, etc.)
