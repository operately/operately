import Api from "@/api";
import type { SiteMessage, SiteMessagesListActiveInput, SiteMessagesListActiveResult } from "@/api";

export type { SiteMessage, SiteMessagesListActiveInput, SiteMessagesListActiveResult };

export function listActive(input: SiteMessagesListActiveInput) {
  return Api.site_messages.listActive(input);
}

export function useListActive(input: SiteMessagesListActiveInput) {
  return Api.site_messages.useListActive(input);
}
