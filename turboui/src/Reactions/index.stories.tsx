import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Reactions } from "./index";
import { genPeople } from "../utils/storybook/genPeople";

const meta: Meta<typeof Reactions> = {
  title: "Components/Reactions",
  component: Reactions,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: { type: "number", min: 16, max: 48, step: 1 },
    },
    canAddReaction: {
      control: "boolean",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const PEOPLE = genPeople(5);
const CURRENT_USER = toReactionPerson(PEOPLE[0]!);
const TEAMMATES = PEOPLE.slice(1).map((person) => toReactionPerson(person));

const INITIAL_REACTIONS: Reactions.Reaction[] = [
  { id: "reaction-1", emoji: "🎉", person: TEAMMATES[0] ?? CURRENT_USER },
  { id: "reaction-2", emoji: "🔥", person: CURRENT_USER },
  { id: "reaction-3", emoji: "🚀", person: TEAMMATES[1] ?? CURRENT_USER },
];

function toReactionPerson(person: { id: string; fullName: string; avatarUrl: string | null }): Reactions.Reaction["person"] {
  return {
    id: person.id,
    fullName: person.fullName,
    avatarUrl: person.avatarUrl,
  };
}

function StoryContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-base border border-surface-outline rounded-xl p-6 shadow-sm max-w-md">
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-content-strong">Activity Reactions</div>
          <div className="text-xs text-content-dimmed">
            Click your own reaction to toggle delete mode, or add a new one with the plus button.
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Interactive: Story = {
  args: {
    size: 24,
    canAddReaction: true,
  },
  render: ({ size, canAddReaction }) => {
    const [reactions, setReactions] = React.useState<Reactions.Reaction[]>(() => [...INITIAL_REACTIONS]);

    const handleAddReaction = React.useCallback((emoji: string) => {
      setReactions((prev) => [
        ...prev,
        {
          id: `reaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          emoji,
          person: CURRENT_USER,
        },
      ]);
    }, []);

    const handleRemoveReaction = React.useCallback((reactionId: string) => {
      setReactions((prev) => prev.filter((reaction) => reaction.id !== reactionId));
    }, []);

    return (
      <StoryContainer>
        <Reactions
          reactions={reactions}
          size={size}
          canAddReaction={canAddReaction}
          currentPersonId={CURRENT_USER.id}
          onAddReaction={canAddReaction ? handleAddReaction : undefined}
          onRemoveReaction={handleRemoveReaction}
        />
      </StoryContainer>
    );
  },
};

export const ReadOnly: Story = {
  args: {
    size: 24,
    canAddReaction: false,
  },
  render: ({ size }) => {
    const reactions = React.useMemo(() => [...INITIAL_REACTIONS], []);

    return (
      <StoryContainer>
        <Reactions reactions={reactions} size={size} canAddReaction={false} />
      </StoryContainer>
    );
  },
};
