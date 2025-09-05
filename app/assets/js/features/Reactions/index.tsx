import * as api from "@/api";
import * as Reactions from "@/models/reactions";
import * as Popover from "@radix-ui/react-popover";
import * as React from "react";
import { IconMoodPlus, IconTrash, IconX } from "turboui";

import classNames from "classnames";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { Avatar } from "turboui";

interface ReactionsFormState {
  reactions: ReactionListItem[];
  submit: (type: string) => void;
  remove: (id: string) => void;
}

interface ReactionListItem {
  id: string;
  person: Pick<api.Person, "id" | "fullName" | "avatarUrl">;
  emoji: string;
}

export function useReactionsForm(entity: Reactions.Entity, initial: Reactions.Reaction[]): ReactionsFormState {
  const me = useMe()!;
  const [add] = Reactions.useAddReaction();
  const [removeReaction] = Reactions.useRemoveReaction();

  const [reactions, setReactions] = React.useState<ReactionListItem[]>(() => {
    return initial.map((reaction: api.Reaction | Reactions.Reaction) => {
      return { id: reaction.id!, person: reaction.person!, emoji: reaction.emoji! };
    });
  });

  const submit = async (emoji: string) => {
    const tempId = `temp-${emoji}-${Date.now()}`;

    setReactions((prev) => {
      const reaction = { id: tempId, emoji: emoji, person: me };
      return [...prev, reaction];
    });

    try {
      const res = await add({
        entityId: entity.id,
        entityType: entity.type,
        parentType: entity.parentType,
        emoji: emoji,
      });

      setReactions((prev) => {
        return prev.map((r) => {
          if (r.id === tempId) {
            return { ...r, id: res.reaction!.id! };
          } else {
            return r;
          }
        });
      });
    } catch (error) {
      setReactions((prev) => {
        return prev.filter((r) => r.id !== tempId);
      });
    }
  };

  const remove = async (id: string) => {
    // Get the reaction before removing it for potential restoration
    const reactionToRemove = reactions.find((r) => r.id === id);

    // Optimistically remove the reaction from UI
    setReactions((prev) => {
      return prev.filter((r) => r.id !== id);
    });

    try {
      await removeReaction({
        reactionId: id,
      });
    } catch (error) {
      // If removal fails, restore the reaction
      if (reactionToRemove) {
        setReactions((prev) => [...prev, reactionToRemove]);
      }
    }
  };

  return {
    reactions,
    submit,
    remove,
  };
}

interface ReactionListProps {
  form: ReactionsFormState;
  size: number;
  canAddReaction: boolean;
}

export function ReactionList({ form, size, canAddReaction }: ReactionListProps) {
  const [deleteMode, setDeleteMode] = React.useState<string | null>(null);

  const handleReactionClick = (reactionId: string) => {
    if (deleteMode === reactionId) {
      setDeleteMode(null); // Hide delete button if clicking the same reaction
    } else {
      setDeleteMode(reactionId); // Show delete button for this reaction
    }
  };

  const handleDeleteClick = (reactionId: string) => {
    form.remove(reactionId);
    setDeleteMode(null); // Hide delete button after removing
  };

  // Hide delete mode when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If we're in delete mode and the click is outside reaction elements
      if (deleteMode && !(event.target as Element)?.closest("[data-reaction-item]")) {
        setDeleteMode(null);
      }
    };

    if (deleteMode) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    } else {
      return () => {};
    }
  }, [deleteMode]);

  return (
    <div className="flex items-start gap-2 flex-wrap">
      {form.reactions.map((reaction, index) => (
        <ReactionItem
          key={index}
          reaction={reaction}
          size={size}
          form={form}
          isInDeleteMode={deleteMode === reaction.id}
          onReactionClick={handleReactionClick}
          onDeleteClick={handleDeleteClick}
        />
      ))}

      {canAddReaction && <AddReaction form={form} size={size} />}
    </div>
  );
}

interface ReactionItemProps {
  reaction: ReactionListItem;
  size: number;
  isInDeleteMode: boolean;
  onReactionClick: (reactionId: string) => void;
  onDeleteClick: (reactionId: string) => void;
}

function ReactionItem({ reaction, size, isInDeleteMode, onReactionClick, onDeleteClick }: ReactionItemProps) {
  const me = useMe()!;
  const testId = `reaction-${reaction.emoji}`;
  const isMyReaction = reaction.person.id === me.id;

  const className = classNames(
    "flex items-center transition-all bg-surface-dimmed rounded-full relative",
    isMyReaction ? "cursor-pointer hover:bg-accent-100" : "",
    isInDeleteMode ? "bg-accent-100" : "",
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the outside click handler
    if (isMyReaction) {
      onReactionClick(reaction.id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick(reaction.id);
  };

  return (
    <div
      className={className}
      data-test-id={testId}
      data-reaction-item
      onClick={handleClick}
      title={isMyReaction ? (isInDeleteMode ? "" : "Click to remove your reaction") : ""}
    >
      <Avatar person={reaction.person} size={size} />
      <div style={{ fontSize: size - 4 }} className="pl-1.5 pr-2">
        {reaction.emoji}
      </div>

      {isInDeleteMode && isMyReaction && (
        <div
          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 cursor-pointer shadow-sm transition-colors"
          onClick={handleDeleteClick}
          title="Remove reaction"
        >
          <IconTrash size={12} className="text-white" />
        </div>
      )}
    </div>
  );
}

function AddReaction({ form, size }) {
  const dropdownClassName = classNames(
    "rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden bg-surface-base",
  );

  const [open, setOpen] = React.useState(false);

  const close = () => setOpen(false);
  const onSelected = (emoji: string) => {
    form.submit(emoji.trim());
    close();
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className="text-content-accent cursor-pointer bg-surface-dimmed rounded-full p-1">
          <IconMoodPlus size={size - 2} />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={dropdownClassName} align="center" sideOffset={5}>
          <ReactionPallete size={size} close={close} onSelected={onSelected} />
          <Popover.Arrow className="fill-surface-outline scale-150" style={{}} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

const PALLETE = [
  ["🚀", "❤️ ", "👍", "👎", "😂", "😮", "😢", "😡"],
  ["🤢", "🤔", "🤯", "🥳", "🤩", "🥺", "🤬", "🤗"],
  ["🤭", "🤫", "📈", "📉", "👏", "🙌", "👊", "🤝"],
  ["🙏", "👌", "🤟", "✌️ ", "👔", "👗", "💯", "🔥"],
  ["🌈", "🍻", "🎉", "🎊", "🎁", "💰", "💸", "🫡"],
];

function ReactionPallete({ size, close, onSelected }) {
  return (
    <div className="bg-surface p-4 py-3 pb-2 flex flex-col gap-0.5">
      <div className="flex items-start justify-between text-content-dimmed w-full">
        <div className="text-sm mb-2 font-medium">Add Reaction</div>
        <div className="">
          <IconX size={16} onClick={close} className="cursor-pointer" />
        </div>
      </div>

      {PALLETE.map((row, index) => (
        <div key={index} className="flex gap-2 items-center">
          {row.map((emoji) => (
            <div
              key={emoji}
              className="hover:scale-125 cursor-pointer"
              onClick={() => onSelected(emoji)}
              data-test-id={`reaction-${emoji}-button`}
            >
              <span style={{ fontSize: size - 2 }}>{emoji}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
