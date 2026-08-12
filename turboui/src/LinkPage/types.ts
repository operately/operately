import type { AvatarPerson } from "../Avatar";
import type { CommentSectionProps } from "../CommentSection";
import type { FormattedTimePreferences } from "../FormattedTime";
import type { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import type { Reactions } from "../Reactions";
import type { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import type { ResourceHubLinkType } from "../ResourceHub/types";
import type { CurrentSubscriptions } from "../Subscriptions";

export namespace LinkPage {
  export interface BaseProps {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    options?: Page.Option[];
    testId?: string;

    linkType: ResourceHubLinkType;
    title: string;
    url: string;
    author: AvatarPerson | null;
    postedAt: string;
    formattedTimePreferences: FormattedTimePreferences;

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
      linkName: string;
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
