import type { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import type { SubscribersSelector } from "../Subscriptions";

export namespace DocumentEditPage {
  export interface Values extends Record<string, unknown> {
    title: string;
    content: unknown;
  }

  export interface BaseProps {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    testId?: string;
    richTextHandlers: RichEditorHandlers;
    initialTitle: string;
    initialContent: unknown;
    cancelLink: string;
    onSubmit: (values: Values, meta: { action: "save" | "publish-draft"; contentChanged: boolean }) => Promise<boolean>;
  }

  type WithSubscriptions = {
    subscriptions: SubscribersSelector.Props;
    hideSubscriptions?: never;
  };

  type WithoutSubscriptions = {
    hideSubscriptions: true;
    subscriptions?: never;
  };

  type WithPublishAction = {
    hidePublishAction?: never;
  };

  type WithoutPublishAction = {
    hidePublishAction: true;
  };

  export type Props = BaseProps & (WithSubscriptions | WithoutSubscriptions) & (WithPublishAction | WithoutPublishAction);
}
