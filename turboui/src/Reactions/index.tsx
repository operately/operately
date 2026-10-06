import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import * as Popover from "../Embedding/Popover";
import * as React from "react";

import classNames from "../utils/classnames";
import { Avatar } from "../Avatar";
import { IconMoodPlus, IconTrash, IconX } from "../icons";
import { showErrorToast } from "../Toasts";
import { compareIds } from "../utils/ids";

export namespace Reactions {
  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    profileLink: string;
  }

  export interface Reaction {
    id: string;
    person: Person;
    emoji: string;
  }

  export interface Props {
    reactions: Reaction[];
    size?: number;
    canAddReaction?: boolean;
    currentPersonId?: string | null;
    onAddReaction?: (emoji: string) => void | Promise<void>;
    onRemoveReaction?: (reactionId: string) => void | Promise<void>;
  }
}

export function Reactions({
  reactions,
  size = 24,
  canAddReaction = true,
  currentPersonId,
  onAddReaction,
  onRemoveReaction,
}: Reactions.Props) {
  const { t } = useTranslation();
  const root = React.useRef<HTMLDivElement>(null);
  const [deleteMode, setDeleteMode] = React.useState<string | null>(null);

  const handleReactionClick = React.useCallback((reactionId: string) => {
    setDeleteMode((current) => (current === reactionId ? null : reactionId));
  }, []);

  const handleDeleteClick = React.useCallback(
    async (reactionId: string) => {
      setDeleteMode(null);
      try {
        await onRemoveReaction?.(reactionId);
      } catch {
        showErrorToast(t("Reaction not removed"), t("Please try again."));
      }
    },
    [onRemoveReaction, t],
  );

  React.useEffect(() => {
    if (!deleteMode) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Only reaction items in this list count as inside, even when Shadow DOM retargets the click.
      const path = event.composedPath();
      const items = root.current?.querySelectorAll("[data-reaction-item]") ?? [];
      const clickedReaction = Array.from(items).some((item) => path.includes(item));
      if (!clickedReaction) setDeleteMode(null);
    };

    const ownerDocument = root.current?.ownerDocument ?? document;
    // Capture also observes clicks stopped by a reaction in another instance.
    ownerDocument.addEventListener("click", handleClickOutside, true);
    return () => ownerDocument.removeEventListener("click", handleClickOutside, true);
  }, [deleteMode]);

  React.useEffect(() => {
    if (deleteMode && !reactions.some((reaction) => reaction.id === deleteMode)) {
      setDeleteMode(null);
    }
  }, [deleteMode, reactions]);

  const showAddReaction = Boolean(canAddReaction && onAddReaction);

  return (
    <div ref={root} className="flex items-start gap-2 flex-wrap">
      {reactions.map((reaction) => {
        const isMyReaction = Boolean(currentPersonId && compareIds(reaction.person.id, currentPersonId));
        const canDeleteReaction = isMyReaction && Boolean(onRemoveReaction);

        return (
          <ReactionItemComponent
            key={reaction.id}
            reaction={reaction}
            size={size}
            isInDeleteMode={deleteMode === reaction.id}
            isMyReaction={isMyReaction}
            canDelete={canDeleteReaction}
            onReactionClick={handleReactionClick}
            onDeleteClick={handleDeleteClick}
          />
        );
      })}

      {showAddReaction && onAddReaction ? <AddReaction size={size} onAddReaction={onAddReaction} /> : null}
    </div>
  );
}

interface ReactionItemProps {
  reaction: Reactions.Reaction;
  size: number;
  isInDeleteMode: boolean;
  isMyReaction: boolean;
  canDelete: boolean;
  onReactionClick: (reactionId: string) => void;
  onDeleteClick: (reactionId: string) => void;
}

function ReactionItemComponent({
  reaction,
  size,
  isInDeleteMode,
  canDelete,
  onReactionClick,
  onDeleteClick,
}: ReactionItemProps) {
  const { t } = useTranslation();
  const testId = `reaction-${reaction.emoji}-${reaction.id}`;

  const className = classNames("flex items-center transition-all bg-surface-dimmed rounded-full relative", {
    "cursor-pointer": canDelete,
  });

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (canDelete) {
      onReactionClick(reaction.id);
    }
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (canDelete) {
      onDeleteClick(reaction.id);
    }
  };

  return (
    <div
      className={className}
      data-test-id={testId}
      data-reaction-item
      onClick={handleClick}
      title={canDelete ? (isInDeleteMode ? "" : t("Click to remove your reaction")) : ""}
    >
      <Avatar person={reaction.person} size={size} />
      <div style={{ fontSize: size - 4 }} className="pl-1.5 pr-2">
        {reaction.emoji}
      </div>

      {isInDeleteMode && canDelete && (
        <div
          className="text-red-500 hover:text-red-600 p-1 pr-2 cursor-pointer"
          onClick={handleDeleteClick}
          title={t("Remove reaction")}
        >
          <IconTrash size={size - 8} />
        </div>
      )}
    </div>
  );
}

interface AddReactionProps {
  size: number;
  onAddReaction: (emoji: string) => void | Promise<void>;
}

function AddReaction({ size, onAddReaction }: AddReactionProps) {
  const { t } = useTranslation();
  const dropdownClassName = classNames(
    "rounded-lg border border-surface-outline z-[100] shadow-xl overflow-hidden bg-surface-base",
  );

  const [open, setOpen] = React.useState(false);

  const close = React.useCallback(() => setOpen(false), []);

  const handleSelected = React.useCallback(
    async (emoji: string) => {
      const trimmed = emoji.trim();
      if (!trimmed) return;

      close();

      try {
        await onAddReaction(trimmed);
      } catch {
        showErrorToast(t("Reaction not added"), t("Please try again."));
      }
    },
    [close, onAddReaction, t],
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div className="text-content-accent cursor-pointer bg-surface-dimmed rounded-full p-1">
          <IconMoodPlus size={size - 2} />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={dropdownClassName} align="center" sideOffset={5}>
          <ReactionPallete size={size} close={close} onSelected={handleSelected} />
          <Popover.Arrow className="fill-surface-outline scale-150" style={{}} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface ReactionPalleteProps {
  size: number;
  close: () => void;
  onSelected: (emoji: string) => void;
}

interface EmojiDataItem {
  emoji: string;
  keywords: string[];
}

// Comprehensive list of common emojis organized by category
const emojiData = (t: TFunction): EmojiDataItem[] => [
  // Positive reactions
  {
    emoji: "👍",
    keywords: [
      "thumbs up, like, yes, approve, good, ok",
      t("thumbs up, like, yes, approve, good, ok", { context: "emoji search" }),
    ],
  },
  {
    emoji: "❤️",
    keywords: ["heart, love, like, favorite", t("heart, love, like, favorite", { context: "emoji search" })],
  },
  {
    emoji: "🚀",
    keywords: [
      "rocket, launch, fast, success, ship",
      t("rocket, launch, fast, success, ship", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🎉",
    keywords: [
      "party, celebrate, celebration, tada, confetti",
      t("party, celebrate, celebration, tada, confetti", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🔥",
    keywords: ["fire, hot, lit, awesome, great", t("fire, hot, lit, awesome, great", { context: "emoji search" })],
  },
  {
    emoji: "💯",
    keywords: [
      "100, perfect, agree, correct, absolutely",
      t("100, perfect, agree, correct, absolutely", { context: "emoji search" }),
    ],
  },
  {
    emoji: "✨",
    keywords: [
      "sparkles, shine, stars, magic, new",
      t("sparkles, shine, stars, magic, new", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🌟",
    keywords: [
      "star, success, excellent, favorite",
      t("star, success, excellent, favorite", { context: "emoji search" }),
    ],
  },
  {
    emoji: "💪",
    keywords: [
      "muscle, strong, strength, power, flex",
      t("muscle, strong, strength, power, flex", { context: "emoji search" }),
    ],
  },
  {
    emoji: "👏",
    keywords: [
      "clap, applause, praise, congratulations, bravo",
      t("clap, applause, praise, congratulations, bravo", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🙌",
    keywords: [
      "hands, celebrate, praise, hooray, yay",
      t("hands, celebrate, praise, hooray, yay", { context: "emoji search" }),
    ],
  },
  {
    emoji: "✅",
    keywords: [
      "check, done, complete, yes, correct",
      t("check, done, complete, yes, correct", { context: "emoji search" }),
    ],
  },
  { emoji: "👌", keywords: ["ok, okay, perfect, good", t("ok, okay, perfect, good", { context: "emoji search" })] },
  {
    emoji: "🎯",
    keywords: [
      "target, goal, bullseye, accuracy, hit",
      t("target, goal, bullseye, accuracy, hit", { context: "emoji search" }),
    ],
  },
  {
    emoji: "💡",
    keywords: ["idea, light, bulb, think, smart", t("idea, light, bulb, think, smart", { context: "emoji search" })],
  },

  // Smileys and faces
  {
    emoji: "😊",
    keywords: ["smile, happy, glad, pleased", t("smile, happy, glad, pleased", { context: "emoji search" })],
  },
  {
    emoji: "😂",
    keywords: ["laugh, lol, haha, funny, joy", t("laugh, lol, haha, funny, joy", { context: "emoji search" })],
  },
  { emoji: "😄", keywords: ["smile, happy, joy, grin", t("smile, happy, joy, grin", { context: "emoji search" })] },
  { emoji: "😁", keywords: ["grin, smile, happy", t("grin, smile, happy", { context: "emoji search" })] },
  {
    emoji: "😅",
    keywords: ["sweat, relief, phew, nervous", t("sweat, relief, phew, nervous", { context: "emoji search" })],
  },
  { emoji: "🤣", keywords: ["rolling, laugh, lol, rofl", t("rolling, laugh, lol, rofl", { context: "emoji search" })] },
  {
    emoji: "😍",
    keywords: ["love, heart eyes, adore, crush", t("love, heart eyes, adore, crush", { context: "emoji search" })],
  },
  {
    emoji: "🥰",
    keywords: ["love, hearts, adore, affection", t("love, hearts, adore, affection", { context: "emoji search" })],
  },
  { emoji: "😎", keywords: ["cool, sunglasses, awesome", t("cool, sunglasses, awesome", { context: "emoji search" })] },
  {
    emoji: "🤩",
    keywords: ["star eyes, wow, excited, amazed", t("star eyes, wow, excited, amazed", { context: "emoji search" })],
  },
  { emoji: "😇", keywords: ["angel, innocent, halo", t("angel, innocent, halo", { context: "emoji search" })] },
  {
    emoji: "🙂",
    keywords: ["smile, slight smile, happy", t("smile, slight smile, happy", { context: "emoji search" })],
  },
  {
    emoji: "🙃",
    keywords: ["upside down, silly, sarcasm", t("upside down, silly, sarcasm", { context: "emoji search" })],
  },
  { emoji: "😉", keywords: ["wink, flirt, playful", t("wink, flirt, playful", { context: "emoji search" })] },

  // Thinking and curious
  {
    emoji: "🤔",
    keywords: [
      "think, thinking, hmm, wonder, consider",
      t("think, thinking, hmm, wonder, consider", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🧐",
    keywords: [
      "monocle, examine, inspect, curious",
      t("monocle, examine, inspect, curious", { context: "emoji search" }),
    ],
  },
  {
    emoji: "💭",
    keywords: ["thought, thinking, bubble, idea", t("thought, thinking, bubble, idea", { context: "emoji search" })],
  },

  // Negative reactions
  {
    emoji: "👎",
    keywords: [
      "thumbs down, dislike, no, bad, disapprove",
      t("thumbs down, dislike, no, bad, disapprove", { context: "emoji search" }),
    ],
  },
  { emoji: "😢", keywords: ["cry, sad, tear, upset", t("cry, sad, tear, upset", { context: "emoji search" })] },
  { emoji: "😭", keywords: ["cry, sob, tears, very sad", t("cry, sob, tears, very sad", { context: "emoji search" })] },
  {
    emoji: "😔",
    keywords: ["sad, pensive, down, disappointed", t("sad, pensive, down, disappointed", { context: "emoji search" })],
  },
  { emoji: "😞", keywords: ["disappointed, sad, upset", t("disappointed, sad, upset", { context: "emoji search" })] },
  {
    emoji: "😕",
    keywords: ["confused, uncertain, puzzled", t("confused, uncertain, puzzled", { context: "emoji search" })],
  },
  {
    emoji: "😟",
    keywords: ["worried, concerned, anxious", t("worried, concerned, anxious", { context: "emoji search" })],
  },
  {
    emoji: "😰",
    keywords: ["anxious, nervous, sweat, worried", t("anxious, nervous, sweat, worried", { context: "emoji search" })],
  },
  {
    emoji: "😨",
    keywords: ["fearful, scared, fear, shock", t("fearful, scared, fear, shock", { context: "emoji search" })],
  },
  {
    emoji: "😱",
    keywords: ["scream, shocked, omg, afraid", t("scream, shocked, omg, afraid", { context: "emoji search" })],
  },
  { emoji: "😡", keywords: ["angry, mad, rage, furious", t("angry, mad, rage, furious", { context: "emoji search" })] },
  { emoji: "😠", keywords: ["angry, mad, upset", t("angry, mad, upset", { context: "emoji search" })] },
  { emoji: "🤬", keywords: ["curse, swear, mad, angry", t("curse, swear, mad, angry", { context: "emoji search" })] },

  // Surprised and amazed
  {
    emoji: "😮",
    keywords: ["wow, surprised, amazed, oh", t("wow, surprised, amazed, oh", { context: "emoji search" })],
  },
  { emoji: "😲", keywords: ["shocked, astonished, gasp", t("shocked, astonished, gasp", { context: "emoji search" })] },
  {
    emoji: "🤯",
    keywords: [
      "mind blown, exploding head, shocked, amazed",
      t("mind blown, exploding head, shocked, amazed", { context: "emoji search" }),
    ],
  },
  {
    emoji: "😳",
    keywords: ["flushed, embarrassed, shocked", t("flushed, embarrassed, shocked", { context: "emoji search" })],
  },

  // Playful and silly
  {
    emoji: "😜",
    keywords: ["tongue, wink, playful, silly", t("tongue, wink, playful, silly", { context: "emoji search" })],
  },
  {
    emoji: "😝",
    keywords: [
      "tongue, playful, silly, closed eyes",
      t("tongue, playful, silly, closed eyes", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🤪",
    keywords: ["crazy, silly, goofy, wacky", t("crazy, silly, goofy, wacky", { context: "emoji search" })],
  },
  { emoji: "🤗", keywords: ["hug, hugging, embrace", t("hug, hugging, embrace", { context: "emoji search" })] },
  {
    emoji: "🤭",
    keywords: [
      "giggle, shy, oops, hand over mouth",
      t("giggle, shy, oops, hand over mouth", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🤫",
    keywords: ["shh, quiet, secret, silence", t("shh, quiet, secret, silence", { context: "emoji search" })],
  },
  {
    emoji: "🥳",
    keywords: ["party, celebrate, birthday, hat", t("party, celebrate, birthday, hat", { context: "emoji search" })],
  },

  // Neutral and tired
  { emoji: "😐", keywords: ["neutral, meh, blank", t("neutral, meh, blank", { context: "emoji search" })] },
  {
    emoji: "😑",
    keywords: ["expressionless, blank, deadpan", t("expressionless, blank, deadpan", { context: "emoji search" })],
  },
  { emoji: "😶", keywords: ["no mouth, silence, quiet", t("no mouth, silence, quiet", { context: "emoji search" })] },
  {
    emoji: "🙄",
    keywords: ["eye roll, whatever, annoyed", t("eye roll, whatever, annoyed", { context: "emoji search" })],
  },
  { emoji: "😴", keywords: ["sleep, tired, sleepy, zzz", t("sleep, tired, sleepy, zzz", { context: "emoji search" })] },
  { emoji: "🥱", keywords: ["yawn, tired, bored", t("yawn, tired, bored", { context: "emoji search" })] },
  { emoji: "😪", keywords: ["sleepy, tired, exhausted", t("sleepy, tired, exhausted", { context: "emoji search" })] },

  // Sick and injured
  {
    emoji: "🤢",
    keywords: ["sick, nauseated, ill, gross", t("sick, nauseated, ill, gross", { context: "emoji search" })],
  },
  {
    emoji: "🤮",
    keywords: ["vomit, sick, puke, throw up", t("vomit, sick, puke, throw up", { context: "emoji search" })],
  },
  {
    emoji: "🤒",
    keywords: ["sick, ill, fever, thermometer", t("sick, ill, fever, thermometer", { context: "emoji search" })],
  },
  {
    emoji: "🤕",
    keywords: ["hurt, injured, bandage, pain", t("hurt, injured, bandage, pain", { context: "emoji search" })],
  },

  // Special expressions
  {
    emoji: "🥺",
    keywords: [
      "pleading, puppy eyes, beg, please",
      t("pleading, puppy eyes, beg, please", { context: "emoji search" }),
    ],
  },
  { emoji: "😬", keywords: ["grimace, awkward, nervous", t("grimace, awkward, nervous", { context: "emoji search" })] },
  {
    emoji: "🤐",
    keywords: [
      "zipper mouth, secret, quiet, sealed",
      t("zipper mouth, secret, quiet, sealed", { context: "emoji search" }),
    ],
  },

  // Hand gestures
  {
    emoji: "👋",
    keywords: ["wave, hello, hi, bye, goodbye", t("wave, hello, hi, bye, goodbye", { context: "emoji search" })],
  },
  {
    emoji: "🤝",
    keywords: [
      "handshake, deal, agreement, shake",
      t("handshake, deal, agreement, shake", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🙏",
    keywords: [
      "pray, please, thanks, namaste, high five",
      t("pray, please, thanks, namaste, high five", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🤞",
    keywords: [
      "fingers crossed, luck, hope, wish",
      t("fingers crossed, luck, hope, wish", { context: "emoji search" }),
    ],
  },
  { emoji: "✌️", keywords: ["peace, victory, v sign", t("peace, victory, v sign", { context: "emoji search" })] },
  {
    emoji: "🤟",
    keywords: ["love, rock, you rock, i love you", t("love, rock, you rock, i love you", { context: "emoji search" })],
  },
  { emoji: "👊", keywords: ["fist, bump, punch, power", t("fist, bump, punch, power", { context: "emoji search" })] },
  {
    emoji: "✊",
    keywords: ["fist, power, solidarity, punch", t("fist, power, solidarity, punch", { context: "emoji search" })],
  },
  { emoji: "👐", keywords: ["open hands, jazz hands", t("open hands, jazz hands", { context: "emoji search" })] },
  {
    emoji: "🙌",
    keywords: [
      "raising hands, celebrate, yay, hooray",
      t("raising hands, celebrate, yay, hooray", { context: "emoji search" }),
    ],
  },

  // Work and productivity
  {
    emoji: "💼",
    keywords: [
      "briefcase, work, business, professional",
      t("briefcase, work, business, professional", { context: "emoji search" }),
    ],
  },
  {
    emoji: "📊",
    keywords: [
      "chart, graph, stats, data, analytics",
      t("chart, graph, stats, data, analytics", { context: "emoji search" }),
    ],
  },
  {
    emoji: "📈",
    keywords: [
      "chart up, growth, trending up, increase",
      t("chart up, growth, trending up, increase", { context: "emoji search" }),
    ],
  },
  {
    emoji: "📉",
    keywords: [
      "chart down, decrease, trending down, decline",
      t("chart down, decrease, trending down, decline", { context: "emoji search" }),
    ],
  },
  {
    emoji: "📝",
    keywords: [
      "memo, note, write, document, pencil",
      t("memo, note, write, document, pencil", { context: "emoji search" }),
    ],
  },
  {
    emoji: "📋",
    keywords: ["clipboard, checklist, todo, list", t("clipboard, checklist, todo, list", { context: "emoji search" })],
  },
  {
    emoji: "📌",
    keywords: ["pin, pushpin, important, mark", t("pin, pushpin, important, mark", { context: "emoji search" })],
  },
  { emoji: "📍", keywords: ["location, pin, map, place", t("location, pin, map, place", { context: "emoji search" })] },
  {
    emoji: "🔔",
    keywords: [
      "bell, notification, alert, reminder",
      t("bell, notification, alert, reminder", { context: "emoji search" }),
    ],
  },
  {
    emoji: "⏰",
    keywords: ["alarm, clock, time, wake up", t("alarm, clock, time, wake up", { context: "emoji search" })],
  },
  { emoji: "⏱️", keywords: ["stopwatch, timer, time", t("stopwatch, timer, time", { context: "emoji search" })] },
  { emoji: "⌛", keywords: ["hourglass, time, waiting", t("hourglass, time, waiting", { context: "emoji search" })] },
  { emoji: "📅", keywords: ["calendar, date, schedule", t("calendar, date, schedule", { context: "emoji search" })] },
  {
    emoji: "🗓️",
    keywords: ["calendar, planning, schedule", t("calendar, planning, schedule", { context: "emoji search" })],
  },

  // Objects and symbols
  {
    emoji: "💰",
    keywords: ["money, bag, dollar, cash, rich", t("money, bag, dollar, cash, rich", { context: "emoji search" })],
  },
  {
    emoji: "💸",
    keywords: ["money, flying, spend, loss", t("money, flying, spend, loss", { context: "emoji search" })],
  },
  { emoji: "💵", keywords: ["dollar, money, bill, cash", t("dollar, money, bill, cash", { context: "emoji search" })] },
  {
    emoji: "💳",
    keywords: ["credit card, payment, card", t("credit card, payment, card", { context: "emoji search" })],
  },
  {
    emoji: "🎁",
    keywords: ["gift, present, box, birthday", t("gift, present, box, birthday", { context: "emoji search" })],
  },
  { emoji: "🎈", keywords: ["balloon, party, celebrate", t("balloon, party, celebrate", { context: "emoji search" })] },
  {
    emoji: "🎊",
    keywords: ["confetti, party, celebration", t("confetti, party, celebration", { context: "emoji search" })],
  },
  {
    emoji: "🏆",
    keywords: [
      "trophy, win, winner, achievement, award",
      t("trophy, win, winner, achievement, award", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🥇",
    keywords: ["first, gold, medal, winner, 1st", t("first, gold, medal, winner, 1st", { context: "emoji search" })],
  },
  {
    emoji: "🥈",
    keywords: ["second, silver, medal, 2nd", t("second, silver, medal, 2nd", { context: "emoji search" })],
  },
  { emoji: "🥉", keywords: ["third, bronze, medal, 3rd", t("third, bronze, medal, 3rd", { context: "emoji search" })] },
  {
    emoji: "🎖️",
    keywords: ["medal, military, honor, award", t("medal, military, honor, award", { context: "emoji search" })],
  },
  { emoji: "⭐", keywords: ["star, favorite, rating", t("star, favorite, rating", { context: "emoji search" })] },
  {
    emoji: "🌈",
    keywords: [
      "rainbow, pride, colorful, diversity",
      t("rainbow, pride, colorful, diversity", { context: "emoji search" }),
    ],
  },
  { emoji: "☀️", keywords: ["sun, sunny, bright, day", t("sun, sunny, bright, day", { context: "emoji search" })] },
  {
    emoji: "⛅",
    keywords: ["cloud, partly sunny, weather", t("cloud, partly sunny, weather", { context: "emoji search" })],
  },
  {
    emoji: "⚡",
    keywords: [
      "lightning, bolt, fast, power, energy",
      t("lightning, bolt, fast, power, energy", { context: "emoji search" }),
    ],
  },
  { emoji: "🔨", keywords: ["hammer, tool, fix, build", t("hammer, tool, fix, build", { context: "emoji search" })] },
  { emoji: "🔧", keywords: ["wrench, tool, fix, repair", t("wrench, tool, fix, repair", { context: "emoji search" })] },
  {
    emoji: "⚙️",
    keywords: [
      "gear, settings, config, configure",
      t("gear, settings, config, configure", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🔗",
    keywords: ["link, chain, connection, url", t("link, chain, connection, url", { context: "emoji search" })],
  },
  {
    emoji: "🔒",
    keywords: ["lock, secure, private, locked", t("lock, secure, private, locked", { context: "emoji search" })],
  },
  { emoji: "🔓", keywords: ["unlock, open, unlocked", t("unlock, open, unlocked", { context: "emoji search" })] },
  {
    emoji: "🔑",
    keywords: ["key, unlock, access, password", t("key, unlock, access, password", { context: "emoji search" })],
  },

  // Food and drinks
  {
    emoji: "☕",
    keywords: ["coffee, tea, hot, drink, cafe", t("coffee, tea, hot, drink, cafe", { context: "emoji search" })],
  },
  { emoji: "🍕", keywords: ["pizza, food, slice", t("pizza, food, slice", { context: "emoji search" })] },
  { emoji: "🍔", keywords: ["burger, hamburger, food", t("burger, hamburger, food", { context: "emoji search" })] },
  {
    emoji: "🍰",
    keywords: ["cake, dessert, sweet, birthday", t("cake, dessert, sweet, birthday", { context: "emoji search" })],
  },
  {
    emoji: "🍻",
    keywords: [
      "beers, cheers, drinks, celebrate, toast",
      t("beers, cheers, drinks, celebrate, toast", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🍾",
    keywords: [
      "champagne, celebrate, bottle, party",
      t("champagne, celebrate, bottle, party", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🥂",
    keywords: [
      "cheers, toast, glasses, celebrate",
      t("cheers, toast, glasses, celebrate", { context: "emoji search" }),
    ],
  },

  // Fashion and style
  {
    emoji: "👔",
    keywords: [
      "tie, formal, business, professional",
      t("tie, formal, business, professional", { context: "emoji search" }),
    ],
  },
  { emoji: "👗", keywords: ["dress, fashion, clothing", t("dress, fashion, clothing", { context: "emoji search" })] },
  { emoji: "👕", keywords: ["shirt, t-shirt, clothing", t("shirt, t-shirt, clothing", { context: "emoji search" })] },
  { emoji: "👓", keywords: ["glasses, eyeglasses, nerd", t("glasses, eyeglasses, nerd", { context: "emoji search" })] },
  { emoji: "🕶️", keywords: ["sunglasses, cool, shades", t("sunglasses, cool, shades", { context: "emoji search" })] },
  {
    emoji: "👑",
    keywords: [
      "crown, king, queen, royalty, best",
      t("crown, king, queen, royalty, best", { context: "emoji search" }),
    ],
  },

  // Special
  {
    emoji: "🫡",
    keywords: [
      "salute, respect, yes sir, military",
      t("salute, respect, yes sir, military", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🍀",
    keywords: [
      "clover, four leaf clover, luck, lucky, shamrock",
      t("clover, four leaf clover, luck, lucky, shamrock", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🤝",
    keywords: ["handshake, agreement, deal", t("handshake, agreement, deal", { context: "emoji search" })],
  },
  {
    emoji: "❗",
    keywords: [
      "exclamation, important, warning, alert",
      t("exclamation, important, warning, alert", { context: "emoji search" }),
    ],
  },
  {
    emoji: "❓",
    keywords: ["question, help, what, confused", t("question, help, what, confused", { context: "emoji search" })],
  },
  {
    emoji: "💬",
    keywords: [
      "speech, comment, talk, chat, message",
      t("speech, comment, talk, chat, message", { context: "emoji search" }),
    ],
  },
  {
    emoji: "👀",
    keywords: ["eyes, look, watch, see, viewing", t("eyes, look, watch, see, viewing", { context: "emoji search" })],
  },
  {
    emoji: "🧠",
    keywords: [
      "brain, smart, think, intelligence",
      t("brain, smart, think, intelligence", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🎨",
    keywords: [
      "art, paint, palette, creative, design",
      t("art, paint, palette, creative, design", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🎭",
    keywords: [
      "theater, drama, masks, performance",
      t("theater, drama, masks, performance", { context: "emoji search" }),
    ],
  },
  {
    emoji: "🎮",
    keywords: ["game, gaming, controller, play", t("game, gaming, controller, play", { context: "emoji search" })],
  },
  { emoji: "🎵", keywords: ["music, note, song", t("music, note, song", { context: "emoji search" })] },
  { emoji: "🎸", keywords: ["guitar, music, rock", t("guitar, music, rock", { context: "emoji search" })] },
  {
    emoji: "📸",
    keywords: ["camera, photo, picture, snapshot", t("camera, photo, picture, snapshot", { context: "emoji search" })],
  },
  {
    emoji: "🚨",
    keywords: ["alert, siren, warning, emergency", t("alert, siren, warning, emergency", { context: "emoji search" })],
  },
  {
    emoji: "⚠️",
    keywords: ["warning, caution, alert, careful", t("warning, caution, alert, careful", { context: "emoji search" })],
  },
  { emoji: "🆕", keywords: ["new, fresh, latest", t("new, fresh, latest", { context: "emoji search" })] },
  { emoji: "🆒", keywords: ["cool, awesome, nice", t("cool, awesome, nice", { context: "emoji search" })] },
  { emoji: "🆓", keywords: ["free, gratis", t("free, gratis", { context: "emoji search" })] },
];

function ReactionPallete({ size, close, onSelected }: ReactionPalleteProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = React.useState("");

  const emojis = React.useMemo(() => emojiData(t), [t]);

  // Filter emojis based on search query
  const filteredEmojis = React.useMemo<EmojiDataItem[]>(() => {
    if (!searchQuery.trim()) {
      return emojis;
    }

    const normalize = (value: string) =>
      value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const query = normalize(searchQuery).trim();
    return emojis.filter((item) => {
      // Search in keywords
      return item.keywords.some((keyword) => normalize(keyword).includes(query));
    });
  }, [searchQuery, emojis]);

  // Create rows of 8 emojis each for display
  const emojiRows = React.useMemo(() => {
    const rows: EmojiDataItem[][] = [];

    for (let i = 0; i < filteredEmojis.length; i += 8) {
      rows.push(filteredEmojis.slice(i, i + 8));
    }
    return rows;
  }, [filteredEmojis]);

  return (
    <div className="bg-surface p-4 py-3 pb-2 flex flex-col gap-0.5">
      <div className="flex items-start justify-between text-content-dimmed w-full">
        <div className="text-sm mb-2 font-medium">{t("Add Reaction")}</div>
        <div className="">
          <IconX size={16} onClick={close} className="cursor-pointer" />
        </div>
      </div>

      {/* Search input */}
      <div className="mb-2">
        <input
          type="text"
          placeholder={t("Search emojis...")}
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
          <div className="text-content-dimmed text-sm py-2 text-center">{t("No emojis found")}</div>
        )}
      </div>
    </div>
  );
}
