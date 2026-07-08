import * as React from "react";

import RichContent from "../RichContent";
import { Editor, useEditor } from "../RichEditor";
import classNames from "../utils/classnames";
import { useFieldError, useFieldValue, useFormContext } from "./context";
import { InputField } from "./FieldGroup";
import { useValidation, validateRichContentPresence } from "./validation";
import type { RichTextAreaProps } from "./types";

const DEFAULTS = {
  required: false,
  horizontalPadding: "px-3",
  verticalPadding: "py-2",
  fontSize: "text-base",
  fontWeight: "font-medium",
  height: "min-h-[250px]",
};

type ResolvedRichTextAreaProps = RichTextAreaProps & typeof DEFAULTS;

export function RichTextArea(props: RichTextAreaProps) {
  const resolvedProps = { ...DEFAULTS, ...props };
  const error = useFieldError(resolvedProps.field);

  useValidation(resolvedProps.field, validateRichContentPresence(resolvedProps.required));

  return (
    <InputField
      field={resolvedProps.field}
      label={resolvedProps.label}
      error={error}
      hidden={resolvedProps.hidden}
      required={resolvedProps.required}
    >
      {resolvedProps.readonly ? (
        <ReadonlyContent {...resolvedProps} />
      ) : (
        <EditableContent {...resolvedProps} error={Boolean(error)} />
      )}
    </InputField>
  );
}

function ReadonlyContent(props: ResolvedRichTextAreaProps) {
  const [value] = useFieldValue(props.field);
  const className = classNames(contentClassName(props), {
    "rounded-lg border border-stroke-base": !props.hideBorder,
  });

  return (
    <div className={className}>
      <RichContent content={value} mentionedPersonLookup={props.richTextHandlers.mentionedPersonLookup} />
    </div>
  );
}

function EditableContent(props: ResolvedRichTextAreaProps & { error: boolean }) {
  const form = useFormContext();
  const [value, setValue] = useFieldValue(props.field);
  const formState = React.useRef(form.state);
  const clearLocalDraft = React.useRef<() => void>(() => undefined);

  const editor = useEditor({
    content: value,
    placeholder: props.placeholder,
    className: contentClassName(props),
    handlers: props.richTextHandlers,
    localDraft: { key: localDraftKey(props.field) },
    onBlur: ({ json }) => {
      setValue(json);
    },
    onUpdate: ({ json }) => {
      setValue(json);
    },
    onUploadStatusChange: (uploading) => {
      form.actions.setState(uploading ? "uploading" : "idle");
    },
  });

  React.useEffect(() => {
    if (!editor.editor || editor.localDraftRestored) {
      return;
    }

    editor.editor.commands.setContent(value);
  }, [editor.editor, editor.localDraftRestored, value]);

  React.useEffect(() => {
    if (!editor.editor || !editor.localDraftRestored) {
      return;
    }

    setValue(editor.editor.getJSON());
  }, [editor.editor, editor.localDraftRestored, setValue]);

  React.useEffect(() => {
    if (!form.lastSubmitSucceededAt) {
      return;
    }

    clearLocalDraft.current();
  }, [form.lastSubmitSucceededAt]);

  React.useEffect(() => {
    formState.current = form.state;
  }, [form.state]);

  React.useEffect(() => {
    clearLocalDraft.current = editor.clearLocalDraft;
  }, [editor.clearLocalDraft]);

  React.useEffect(() => {
    return () => {
      if (formState.current === "submitting") {
        clearLocalDraft.current();
      }
    };
  }, []);

  return (
    <div className={wrapperClassName(props)}>
      <Editor editor={editor} hideToolbar={props.hideToolbar} hideBorder padding="p-0" />
    </div>
  );
}

function localDraftKey(field: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `form:${window.location.pathname}:${field}`;
}

function contentClassName(props: Pick<ResolvedRichTextAreaProps, "horizontalPadding" | "verticalPadding" | "fontSize" | "fontWeight" | "height">) {
  return classNames(props.horizontalPadding, props.verticalPadding, props.fontSize, props.fontWeight, props.height);
}

function wrapperClassName(props: ResolvedRichTextAreaProps & { error: boolean }) {
  return classNames("w-full bg-surface-base text-content-accent placeholder-content-subtle", {
    "rounded-lg border": !props.hideBorder,
    "border-surface-outline": !props.error,
    "border-red-500": props.error,
  });
}
