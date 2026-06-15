import * as React from "react";

import { useStateWithLocalStorage } from "@/hooks/useStateWithLocalStorage";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import * as People from "@/models/people";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { IconInfoCircleFilled, IconX, RichContent } from "turboui";

const STORAGE_NAMESPACE = "announcements";
const STORAGE_KEY = "dismissed-site-message-ids";

function MessageDescription({ description }: { description: string }) {
  const { mentionedPersonLookup } = useRichEditorHandlers({ scope: People.NoneSearchScope });

  return (
    <RichContent
      content={description}
      mentionedPersonLookup={mentionedPersonLookup}
      parseContent
      className="mt-1 text-sm leading-6 text-yellow-900 [&_a]:text-yellow-950 [&_a]:underline [&_p+p]:mt-2"
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

  const dismiss = () => {
    setDismissedIds((current) => (current.includes(visibleMessage.id!) ? current : [...current, visibleMessage.id!]));
  };

  return (
    <div
      className="border-b border-surface-outline bg-yellow-50 text-yellow-950"
      data-test-id="site-message-banner"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-200 bg-yellow-100 text-yellow-700 shadow-sm">
            <IconInfoCircleFilled size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-yellow-950">{visibleMessage.title}</div>
            <MessageDescription description={visibleMessage.description} />
          </div>
        </div>

        <button
          type="button"
          className="mt-0.5 shrink-0 rounded-md p-1 text-yellow-700 transition-colors hover:bg-yellow-100 hover:text-yellow-900"
          data-test-id="site-message-banner-dismiss"
          aria-label="Dismiss message"
          onClick={dismiss}
        >
          <IconX size={18} />
        </button>
      </div>
    </div>
  );
}
