import type { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import type { RichEditorHandlers } from "../RichEditor/useEditor";

export namespace LinkEditPage {
  export interface Values extends Record<string, unknown> {
    title: string;
    url: string;
    description: unknown;
  }

  export interface Props {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    testId?: string;
    richTextHandlers: RichEditorHandlers;
    initialTitle: string;
    initialUrl: string;
    initialDescription: unknown;
    cancelLink: string;
    submitLabel?: string;
    onSubmit: (values: Values, meta: { contentChanged: boolean }) => Promise<boolean>;
  }
}
