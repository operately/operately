import * as React from "react";

import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import * as People from "@/models/people";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { SiteMessageBanner as SiteMessageBannerUI, RichContent } from "turboui";

const STORAGE_NAMESPACE = "announcements";
const STORAGE_KEY = "dismissed-site-message-ids";

function MessageDescription({ description }: { description: string }) {
  const { mentionedPersonLookup } = useRichEditorHandlers({ scope: People.NoneSearchScope });

  return (
    <RichContent
      taskList={{ canEdit: false }}
      content={description}
      mentionedPersonLookup={mentionedPersonLookup}
      parseContent
      // RichContent renders block wrappers; contents + inline <p> lets the description
      // flow after the bold title as one paragraph instead of a separate column.
      className="contents text-yellow-900 [&_div]:contents [&_p]:inline [&_p]:m-0 [&_a]:text-yellow-950 [&_a]:underline"
    />
  );
}

export function SiteMessageBanner() {
  const { siteMessages } = useCompanyLoaderData();
  const [dismissedIds, setDismissedIds] = useStateWithLocalStorage<string[]>(STORAGE_NAMESPACE, STORAGE_KEY, []);

  const visibleMessage = siteMessages.find((message) => message.id && !dismissedIds.includes(message.id));

  if (!visibleMessage || !visibleMessage.id) {
    return null;
  }

  const messageId = visibleMessage.id;
  const dismiss = () => {
    setDismissedIds((current) => (current.includes(messageId) ? current : [...current, messageId]));
  };

  return (
    <SiteMessageBannerUI
      title={visibleMessage.title}
      description={<MessageDescription description={visibleMessage.description} />}
      onDismiss={dismiss}
    />
  );
}
