import React from "react";

import { CommentParentType } from "@/api";
import { CommentSection as TurboUICommentSection } from "turboui";

import { FormState } from "./form";
import { useCommentSectionProps } from "./useCommentSectionProps";

interface CommentSectionProps {
  form: FormState;
  commentParentType: CommentParentType;
  canComment: boolean;
  ackLabel?: string;
}

export function CommentSection({ form, commentParentType, canComment, ackLabel }: CommentSectionProps) {
  const props = useCommentSectionProps({ form, commentParentType, canComment, ackLabel });

  if (!props) return null;

  return <TurboUICommentSection {...props} />;
}
