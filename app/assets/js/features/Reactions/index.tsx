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

  const className = classNames("flex items-center transition-all bg-surface-dimmed rounded-full relative", {
    "cursor-pointer": isMyReaction,
  });

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
          className="text-red-500 hover:text-red-600 p-1 pr-2 cursor-pointer"
          onClick={handleDeleteClick}
          title="Remove reaction"
        >
          <IconTrash size={size - 8} />
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

// Comprehensive list of common emojis organized by category
const EMOJI_DATA = [
  // Positive reactions
  { emoji: "👍", keywords: ["thumbs up", "like", "yes", "approve", "good", "ok"] },
  { emoji: "❤️", keywords: ["heart", "love", "like", "favorite"] },
  { emoji: "🚀", keywords: ["rocket", "launch", "fast", "success", "ship"] },
  { emoji: "🎉", keywords: ["party", "celebrate", "celebration", "tada", "confetti"] },
  { emoji: "🔥", keywords: ["fire", "hot", "lit", "awesome", "great"] },
  { emoji: "💯", keywords: ["100", "perfect", "agree", "correct", "absolutely"] },
  { emoji: "✨", keywords: ["sparkles", "shine", "stars", "magic", "new"] },
  { emoji: "🌟", keywords: ["star", "success", "excellent", "favorite"] },
  { emoji: "💪", keywords: ["muscle", "strong", "strength", "power", "flex"] },
  { emoji: "👏", keywords: ["clap", "applause", "praise", "congratulations", "bravo"] },
  { emoji: "🙌", keywords: ["hands", "celebrate", "praise", "hooray", "yay"] },
  { emoji: "✅", keywords: ["check", "done", "complete", "yes", "correct"] },
  { emoji: "👌", keywords: ["ok", "okay", "perfect", "good"] },
  { emoji: "🎯", keywords: ["target", "goal", "bullseye", "accuracy", "hit"] },
  { emoji: "💡", keywords: ["idea", "light", "bulb", "think", "smart"] },

  // Smileys and faces
  { emoji: "😊", keywords: ["smile", "happy", "glad", "pleased"] },
  { emoji: "😂", keywords: ["laugh", "lol", "haha", "funny", "joy"] },
  { emoji: "😄", keywords: ["smile", "happy", "joy", "grin"] },
  { emoji: "😁", keywords: ["grin", "smile", "happy"] },
  { emoji: "😅", keywords: ["sweat", "relief", "phew", "nervous"] },
  { emoji: "🤣", keywords: ["rolling", "laugh", "lol", "rofl"] },
  { emoji: "😍", keywords: ["love", "heart eyes", "adore", "crush"] },
  { emoji: "🥰", keywords: ["love", "hearts", "adore", "affection"] },
  { emoji: "😎", keywords: ["cool", "sunglasses", "awesome"] },
  { emoji: "🤩", keywords: ["star eyes", "wow", "excited", "amazed"] },
  { emoji: "😇", keywords: ["angel", "innocent", "halo"] },
  { emoji: "🙂", keywords: ["smile", "slight smile", "happy"] },
  { emoji: "🙃", keywords: ["upside down", "silly", "sarcasm"] },
  { emoji: "😉", keywords: ["wink", "flirt", "playful"] },

  // Thinking and curious
  { emoji: "🤔", keywords: ["think", "thinking", "hmm", "wonder", "consider"] },
  { emoji: "🧐", keywords: ["monocle", "examine", "inspect", "curious"] },
  { emoji: "💭", keywords: ["thought", "thinking", "bubble", "idea"] },

  // Negative reactions
  { emoji: "👎", keywords: ["thumbs down", "dislike", "no", "bad", "disapprove"] },
  { emoji: "😢", keywords: ["cry", "sad", "tear", "upset"] },
  { emoji: "😭", keywords: ["cry", "sob", "tears", "very sad"] },
  { emoji: "😔", keywords: ["sad", "pensive", "down", "disappointed"] },
  { emoji: "😞", keywords: ["disappointed", "sad", "upset"] },
  { emoji: "😕", keywords: ["confused", "uncertain", "puzzled"] },
  { emoji: "😟", keywords: ["worried", "concerned", "anxious"] },
  { emoji: "😰", keywords: ["anxious", "nervous", "sweat", "worried"] },
  { emoji: "😨", keywords: ["fearful", "scared", "fear", "shock"] },
  { emoji: "😱", keywords: ["scream", "shocked", "omg", "afraid"] },
  { emoji: "😡", keywords: ["angry", "mad", "rage", "furious"] },
  { emoji: "😠", keywords: ["angry", "mad", "upset"] },
  { emoji: "🤬", keywords: ["curse", "swear", "mad", "angry"] },

  // Surprised and amazed
  { emoji: "😮", keywords: ["wow", "surprised", "amazed", "oh"] },
  { emoji: "😲", keywords: ["shocked", "astonished", "gasp"] },
  { emoji: "🤯", keywords: ["mind blown", "exploding head", "shocked", "amazed"] },
  { emoji: "😳", keywords: ["flushed", "embarrassed", "shocked"] },

  // Playful and silly
  { emoji: "😜", keywords: ["tongue", "wink", "playful", "silly"] },
  { emoji: "😝", keywords: ["tongue", "playful", "silly", "closed eyes"] },
  { emoji: "🤪", keywords: ["crazy", "silly", "goofy", "wacky"] },
  { emoji: "🤗", keywords: ["hug", "hugging", "embrace"] },
  { emoji: "🤭", keywords: ["giggle", "shy", "oops", "hand over mouth"] },
  { emoji: "🤫", keywords: ["shh", "quiet", "secret", "silence"] },
  { emoji: "🥳", keywords: ["party", "celebrate", "birthday", "hat"] },

  // Neutral and tired
  { emoji: "😐", keywords: ["neutral", "meh", "blank"] },
  { emoji: "😑", keywords: ["expressionless", "blank", "deadpan"] },
  { emoji: "😶", keywords: ["no mouth", "silence", "quiet"] },
  { emoji: "🙄", keywords: ["eye roll", "whatever", "annoyed"] },
  { emoji: "😴", keywords: ["sleep", "tired", "sleepy", "zzz"] },
  { emoji: "🥱", keywords: ["yawn", "tired", "bored"] },
  { emoji: "😪", keywords: ["sleepy", "tired", "exhausted"] },

  // Sick and injured
  { emoji: "🤢", keywords: ["sick", "nauseated", "ill", "gross"] },
  { emoji: "🤮", keywords: ["vomit", "sick", "puke", "throw up"] },
  { emoji: "🤒", keywords: ["sick", "ill", "fever", "thermometer"] },
  { emoji: "🤕", keywords: ["hurt", "injured", "bandage", "pain"] },

  // Special expressions
  { emoji: "🥺", keywords: ["pleading", "puppy eyes", "beg", "please"] },
  { emoji: "😬", keywords: ["grimace", "awkward", "nervous"] },
  { emoji: "🤐", keywords: ["zipper mouth", "secret", "quiet", "sealed"] },

  // Hand gestures
  { emoji: "👋", keywords: ["wave", "hello", "hi", "bye", "goodbye"] },
  { emoji: "🤝", keywords: ["handshake", "deal", "agreement", "shake"] },
  { emoji: "🙏", keywords: ["pray", "please", "thanks", "namaste", "high five"] },
  { emoji: "🤞", keywords: ["fingers crossed", "luck", "hope", "wish"] },
  { emoji: "✌️", keywords: ["peace", "victory", "v sign"] },
  { emoji: "🤟", keywords: ["love", "rock", "you rock", "i love you"] },
  { emoji: "👊", keywords: ["fist", "bump", "punch", "power"] },
  { emoji: "✊", keywords: ["fist", "power", "solidarity", "punch"] },
  { emoji: "👐", keywords: ["open hands", "jazz hands"] },
  { emoji: "🙌", keywords: ["raising hands", "celebrate", "yay", "hooray"] },

  // Work and productivity
  { emoji: "💼", keywords: ["briefcase", "work", "business", "professional"] },
  { emoji: "📊", keywords: ["chart", "graph", "stats", "data", "analytics"] },
  { emoji: "📈", keywords: ["chart up", "growth", "trending up", "increase"] },
  { emoji: "📉", keywords: ["chart down", "decrease", "trending down", "decline"] },
  { emoji: "📝", keywords: ["memo", "note", "write", "document", "pencil"] },
  { emoji: "📋", keywords: ["clipboard", "checklist", "todo", "list"] },
  { emoji: "📌", keywords: ["pin", "pushpin", "important", "mark"] },
  { emoji: "📍", keywords: ["location", "pin", "map", "place"] },
  { emoji: "🔔", keywords: ["bell", "notification", "alert", "reminder"] },
  { emoji: "⏰", keywords: ["alarm", "clock", "time", "wake up"] },
  { emoji: "⏱️", keywords: ["stopwatch", "timer", "time"] },
  { emoji: "⌛", keywords: ["hourglass", "time", "waiting"] },
  { emoji: "📅", keywords: ["calendar", "date", "schedule"] },
  { emoji: "🗓️", keywords: ["calendar", "planning", "schedule"] },

  // Objects and symbols
  { emoji: "💰", keywords: ["money", "bag", "dollar", "cash", "rich"] },
  { emoji: "💸", keywords: ["money", "flying", "spend", "loss"] },
  { emoji: "💵", keywords: ["dollar", "money", "bill", "cash"] },
  { emoji: "💳", keywords: ["credit card", "payment", "card"] },
  { emoji: "🎁", keywords: ["gift", "present", "box", "birthday"] },
  { emoji: "🎈", keywords: ["balloon", "party", "celebrate"] },
  { emoji: "🎊", keywords: ["confetti", "party", "celebration"] },
  { emoji: "🏆", keywords: ["trophy", "win", "winner", "achievement", "award"] },
  { emoji: "🥇", keywords: ["first", "gold", "medal", "winner", "1st"] },
  { emoji: "🥈", keywords: ["second", "silver", "medal", "2nd"] },
  { emoji: "🥉", keywords: ["third", "bronze", "medal", "3rd"] },
  { emoji: "🎖️", keywords: ["medal", "military", "honor", "award"] },
  { emoji: "⭐", keywords: ["star", "favorite", "rating"] },
  { emoji: "🌈", keywords: ["rainbow", "pride", "colorful", "diversity"] },
  { emoji: "☀️", keywords: ["sun", "sunny", "bright", "day"] },
  { emoji: "⛅", keywords: ["cloud", "partly sunny", "weather"] },
  { emoji: "⚡", keywords: ["lightning", "bolt", "fast", "power", "energy"] },
  { emoji: "🔨", keywords: ["hammer", "tool", "fix", "build"] },
  { emoji: "🔧", keywords: ["wrench", "tool", "fix", "repair"] },
  { emoji: "⚙️", keywords: ["gear", "settings", "config", "configure"] },
  { emoji: "🔗", keywords: ["link", "chain", "connection", "url"] },
  { emoji: "🔒", keywords: ["lock", "secure", "private", "locked"] },
  { emoji: "🔓", keywords: ["unlock", "open", "unlocked"] },
  { emoji: "🔑", keywords: ["key", "unlock", "access", "password"] },

  // Food and drinks
  { emoji: "☕", keywords: ["coffee", "tea", "hot", "drink", "cafe"] },
  { emoji: "🍕", keywords: ["pizza", "food", "slice"] },
  { emoji: "🍔", keywords: ["burger", "hamburger", "food"] },
  { emoji: "🍰", keywords: ["cake", "dessert", "sweet", "birthday"] },
  { emoji: "🍻", keywords: ["beers", "cheers", "drinks", "celebrate", "toast"] },
  { emoji: "🍾", keywords: ["champagne", "celebrate", "bottle", "party"] },
  { emoji: "🥂", keywords: ["cheers", "toast", "glasses", "celebrate"] },

  // Fashion and style
  { emoji: "👔", keywords: ["tie", "formal", "business", "professional"] },
  { emoji: "👗", keywords: ["dress", "fashion", "clothing"] },
  { emoji: "👕", keywords: ["shirt", "t-shirt", "clothing"] },
  { emoji: "👓", keywords: ["glasses", "eyeglasses", "nerd"] },
  { emoji: "🕶️", keywords: ["sunglasses", "cool", "shades"] },
  { emoji: "👑", keywords: ["crown", "king", "queen", "royalty", "best"] },

  // Special
  { emoji: "🫡", keywords: ["salute", "respect", "yes sir", "military"] },
  { emoji: "🍀", keywords: ["clover", "four leaf clover", "luck", "lucky", "shamrock"] },
  { emoji: "🤝", keywords: ["handshake", "agreement", "deal"] },
  { emoji: "❗", keywords: ["exclamation", "important", "warning", "alert"] },
  { emoji: "❓", keywords: ["question", "help", "what", "confused"] },
  { emoji: "💬", keywords: ["speech", "comment", "talk", "chat", "message"] },
  { emoji: "👀", keywords: ["eyes", "look", "watch", "see", "viewing"] },
  { emoji: "🧠", keywords: ["brain", "smart", "think", "intelligence"] },
  { emoji: "🎨", keywords: ["art", "paint", "palette", "creative", "design"] },
  { emoji: "🎭", keywords: ["theater", "drama", "masks", "performance"] },
  { emoji: "🎮", keywords: ["game", "gaming", "controller", "play"] },
  { emoji: "🎵", keywords: ["music", "note", "song"] },
  { emoji: "🎸", keywords: ["guitar", "music", "rock"] },
  { emoji: "📸", keywords: ["camera", "photo", "picture", "snapshot"] },
  { emoji: "🚨", keywords: ["alert", "siren", "warning", "emergency"] },
  { emoji: "⚠️", keywords: ["warning", "caution", "alert", "careful"] },
  { emoji: "🆕", keywords: ["new", "fresh", "latest"] },
  { emoji: "🆒", keywords: ["cool", "awesome", "nice"] },
  { emoji: "🆓", keywords: ["free", "gratis"] },
];

function ReactionPallete({ size, close, onSelected }) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter emojis based on search query
  const filteredEmojis = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return EMOJI_DATA;
    }

    const query = searchQuery.toLowerCase().trim();
    return EMOJI_DATA.filter((item) => {
      // Search in keywords
      return item.keywords.some((keyword) => keyword.includes(query));
    });
  }, [searchQuery]);

  // Create rows of 8 emojis each for display
  const emojiRows = React.useMemo(() => {
    const rows: (typeof filteredEmojis)[] = [];

    for (let i = 0; i < filteredEmojis.length; i += 8) {
      rows.push(filteredEmojis.slice(i, i + 8));
    }
    return rows;
  }, [filteredEmojis]);

  return (
    <div className="bg-surface p-4 py-3 pb-2 flex flex-col gap-0.5">
      <div className="flex items-start justify-between text-content-dimmed w-full">
        <div className="text-sm mb-2 font-medium">Add Reaction</div>
        <div className="">
          <IconX size={16} onClick={close} className="cursor-pointer" />
        </div>
      </div>

      {/* Search input */}
      <div className="mb-2">
        <input
          type="text"
          placeholder="Search emojis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-surface-outline rounded bg-surface-dimmed text-content-base placeholder-content-dimmed focus:outline-none focus:border-accent-1"
          autoFocus
        />
      </div>

      {/* Emoji grid */}
      <div className="max-h-64 overflow-y-auto">
        {emojiRows.length > 0 ? (
          emojiRows.map((row, index) => (
            <div key={index} className="flex gap-2 items-center mb-1">
              {row.map((item) => (
                <div
                  key={item.emoji}
                  className="hover:scale-125 cursor-pointer"
                  onClick={() => onSelected(item.emoji)}
                  data-test-id={`reaction-${item.emoji}-button`}
                  title={item.keywords.join(", ")}
                >
                  <span style={{ fontSize: size - 2 }}>{item.emoji}</span>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="text-content-dimmed text-sm py-2 text-center">No emojis found</div>
        )}
      </div>
    </div>
  );
}
