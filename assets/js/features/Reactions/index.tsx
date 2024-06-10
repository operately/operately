import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Reactions from "@/models/reactions";
import * as Popover from "@radix-ui/react-popover";
import * as People from "@/models/people";

import classNames from "classnames";

import Avatar from "@/components/Avatar";

interface ReactionsFormState {
  reactions: ReactionListItem[];
  submit: (type: string) => void;
}

interface Entity {
  id: string;
  type: string;
}

interface ReactionListItem {
  id: string;
  person: People.Person;
  emoji: string;
}

export function useReactionsForm(entity: Entity, initial: Reactions.Reaction[], me: People.Person): ReactionsFormState {
  const [add] = Reactions.useAddReaction();

  const [reactions, setReactions] = React.useState<ReactionListItem[]>(() => {
    return initial.map((reaction) => {
      return { id: reaction.id, person: reaction.person, emoji: reaction.emoji };
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
        variables: {
          input: {
            entityId: entity.id,
            entityType: entity.type,
            emoji: emoji,
          },
        },
      });

      setReactions((prev) => {
        return prev.map((r) => {
          if (r.id === tempId) {
            return { ...r, id: res.data!.addReaction.id };
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

  return {
    reactions,
    submit,
  };
}

export function ReactionList({ form, size }: { form: ReactionsFormState; size: number }) {
  return (
    <div className="flex items-start gap-2 flex-wrap">
      {form.reactions.map((reaction, index) => (
        <ReactionItem key={index} reaction={reaction} size={size} />
      ))}

      <AddReaction form={form} size={size} />
    </div>
  );
}

function ReactionItem({ reaction, size }) {
  const testId = `reaction-${reaction.reactionType}`;
  const className = classNames("flex items-center transition-all bg-surface-dimmed rounded-full");

  return (
    <div className={className} data-test-id={testId}>
      <Avatar person={reaction.person} size={size} />
      <div style={{ fontSize: size - 4 }} className="pl-1.5 pr-2">
        {reaction.emoji}
      </div>
    </div>
  );
}

function AddReaction({ form, size }) {
  const dropdownClassName = classNames("rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden");

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
          <Icons.IconMoodPlus size={size - 2} />
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
          <Icons.IconX size={16} onClick={close} className="cursor-pointer" />
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
