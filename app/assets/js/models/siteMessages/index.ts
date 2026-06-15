import Api from "@/api";
import type { SiteMessage, SiteMessagesListActiveInput } from "@/api";

export type { SiteMessage };

export function listActive(input: SiteMessagesListActiveInput) {
  return Api.site_messages.listActive(input);
}
