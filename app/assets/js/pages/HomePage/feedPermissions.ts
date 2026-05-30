import { includesId } from "@/routes/paths";

interface CanDeleteFeedItemsInput {
  personId?: string | null;
  adminIds: string[];
  ownerIds: string[];
}

export function canDeleteFeedItems({ personId, adminIds, ownerIds }: CanDeleteFeedItemsInput): boolean {
  if (!personId) return false;

  return includesId(adminIds, personId) || includesId(ownerIds, personId);
}
