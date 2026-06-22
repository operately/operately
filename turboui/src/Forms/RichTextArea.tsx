import * as React from "react";

import { Editor, useEditor } from "../RichEditor";
import classNames from "../utils/classnames";
import { useFieldError, useFieldValue, useFormContext } from "./context";
import { InputField } from "./FieldGroup";
import { useValidation, validateRichContentPresence } from "./validation";
import type { RichTextAreaProps } from "./types";

const DEFAULT_HEIGHT = "min-h-[80px]";

export function RichTextArea({
  field,
  richTextHandlers,
  label,
  placeholder,
  required,
  height = DEFAULT_HEIGHT,
}: RichTextAreaProps) {
  const form = useFormContext();
  const [value, setValue] = useFieldValue(field);
  const error = useFieldError(field);
  const formState = React.useRef(form.state);
  const clearLocalDraft = React.useRef<() => void>(() => undefined);

  useValidation(field, validateRichContentPresence(required));

  const editor = useEditor({
    content: value,
    placeholder,
    className: classNames("px-3 py-2 text-base font-medium", height),
    handlers: richTextHandlers,
    localDraft: { key: localDraftKey(field) },
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
  }, [editor.editor, editor.localDraftRestored]);

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
    <InputField field={field} label={label} error={error} required={required}>
      <div
        className={classNames("w-full rounded-lg border bg-surface-base", {
          "border-red-500": Boolean(error),
          "border-surface-outline": !error,
        })}
      >
        <Editor editor={editor} hideBorder padding="p-0" />
      </div>
    </InputField>
  );
}

function localDraftKey(field: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `form:${window.location.pathname}:${field}`;
}
