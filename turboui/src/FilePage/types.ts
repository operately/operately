import type { AvatarPerson } from "../Avatar";
import type { CommentSectionProps } from "../CommentSection";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import type { Reactions } from "../Reactions";
import type { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import type { CurrentSubscriptions } from "../Subscriptions";

export namespace FilePage {
  export interface BlobPreview {
    url: string;
    contentType?: string | null;
    width?: number | null;
    height?: number | null;
  }

  export interface BaseProps {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    options?: Page.Option[];
    testId?: string;

    title: string;
    author: AvatarPerson | null;
    postedAt: string;
    formattedTimePreferences: FormattedTimePreferences;

    filename: string;
    fileSize: string;
    viewUrl: string;
    onDownload: () => void;
    blob: BlobPreview;

    description: unknown | null;
    mentionedPersonLookup: MentionedPersonLookupFn;
  }

  type WithReactions = {
    reactions: Reactions.Props;
    hideReactions?: never;
  };

  type WithoutReactions = {
    hideReactions: true;
    reactions?: never;
  };

  type WithComments = {
    comments: CommentSectionProps;
    hideComments?: never;
  };

  type WithoutComments = {
    hideComments: true;
    comments?: never;
  };

  type WithSubscriptions = {
    subscriptions: CurrentSubscriptions.Props;
    hideSubscriptions?: never;
  };

  type WithoutSubscriptions = {
    hideSubscriptions: true;
    subscriptions?: never;
  };

  type WithDeleteModal = {
    deleteModal: {
      isOpen: boolean;
      onClose: () => void;
      fileName: string;
      onConfirm: () => void | Promise<void>;
    };
    hideDeleteModal?: never;
  };

  type WithoutDeleteModal = {
    hideDeleteModal: true;
    deleteModal?: never;
  };

  export type Props = BaseProps &
    (WithReactions | WithoutReactions) &
    (WithComments | WithoutComments) &
    (WithSubscriptions | WithoutSubscriptions) &
    (WithDeleteModal | WithoutDeleteModal);
}
