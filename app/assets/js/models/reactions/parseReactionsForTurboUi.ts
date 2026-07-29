import * as api from "@/api";
import * as People from "@/models/people";
import { Paths } from "@/routes/paths";

/**
 * Parses backend Reaction objects to the format expected by TurboUI
 */
export function parseReactionsForTurboUi(paths: Paths, reactions: api.Reaction[] | null | undefined) {
  if (!reactions) return [];

  return reactions
    .map((reaction) => {
      if (!reaction?.id || !reaction.emoji) return null;

      const person = People.parsePersonForTurboUi(paths, reaction.person);
      if (!person) return null;

      return {
        id: reaction.id,
        emoji: reaction.emoji,
        person,
      };
    })
    .filter(
      (
        reaction,
      ): reaction is {
        id: string;
        emoji: string;
        person: NonNullable<ReturnType<typeof People.parsePersonForTurboUi>>;
      } => reaction !== null,
    );
}
