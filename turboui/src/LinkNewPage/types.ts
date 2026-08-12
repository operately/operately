import type { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { ResourceHubLinkType } from "../ResourceHub/types";
import type { SubscribersSelector } from "../Subscriptions";

export namespace LinkNewPage {
  export interface Values extends Record<string, unknown> {
    title: string;
    link: string;
    type: ResourceHubLinkType;
    description: unknown;
  }

  export interface BaseProps {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    testId?: string;
    richTextHandlers: RichEditorHandlers;
    initialType: ResourceHubLinkType;
    cancelLink: string;
    submitLabel?: string;
    onSubmit: (values: Values) => Promise<boolean>;
  }

  type WithSubscriptions = {
    subscriptions: SubscribersSelector.Props;
    hideSubscriptions?: never;
  };

  type WithoutSubscriptions = {
    hideSubscriptions: true;
    subscriptions?: never;
  };

  export type Props = BaseProps & (WithSubscriptions | WithoutSubscriptions);
}
