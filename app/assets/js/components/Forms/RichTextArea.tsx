import * as React from "react";
import * as People from "@/models/people";

import { InputField } from "./FieldGroup";
import { useFieldError, useFieldValue, useFormContext } from "./FormContext";
import { useValidation } from "./validations/hook";

import classNames from "classnames";
import { validateRichContentPresence } from "./validations/richContentPresence";
import { isContentEmpty, useEditor, Editor as RichTextEditor, RichContent } from "turboui";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";

interface RichTextAreaProps {
  field: string;
  mentionSearchScope: People.SearchScope;

  label?: string;
  hidden?: boolean;
  placeholder?: string;
  hideBorder?: boolean;
  required?: boolean;
  height?: string;
  horizontalPadding?: string;
  verticalPadding?: string;
  fontSize?: string;
  fontWeight?: string;
  showToolbarTopBorder?: boolean;
  readonly?: boolean;
  hideToolbar?: boolean;
  autosaveKey?: string;
}

const DEFAULT_VALUES = {
  required: false,
  horizontalPadding: "px-3",
  verticalPadding: "py-2",
  fontSize: "text-base",
  fontWeight: "font-medium",
  height: "min-h-[250px]",
};

const AUTOSAVE_TTL_MS = 1000 * 60 * 60 * 6;

export function RichTextArea(props: RichTextAreaProps) {
  props = { ...DEFAULT_VALUES, ...props };
  const error = useFieldError(props.field);

  useValidation(props.field, validateRichContentPresence(props.required));

  return (
    <InputField field={props.field} label={props.label} error={error} hidden={props.hidden}>
      {props.readonly ? <ReadonlyContent {...props} /> : <Editor {...props} error={!!error} />}
    </InputField>
  );
}

function ReadonlyContent(props: RichTextAreaProps) {
  const [value] = useFieldValue(props.field);
  const className = classNames(contentClassName(props), {
    "border rounded-lg border-stroke-base": !props.hideBorder,
  });
  const { mentionedPersonLookup } = useRichEditorHandlers({ scope: props.mentionSearchScope });

  return (
    <div className={className}>
      <RichContent content={value} mentionedPersonLookup={mentionedPersonLookup} />
    </div>
  );
}

function Editor(props: RichTextAreaProps & { error: boolean }) {
  const form = useFormContext();
  const [value, setValue] = useFieldValue(props.field);
  const autosaveKey = React.useMemo(() => {
    if (props.autosaveKey) return props.autosaveKey;
    return `operately:richtext:${window.location.pathname}${window.location.search}:${props.field}`;
  }, [props.autosaveKey, props.field]);

  const handlers = useRichEditorHandlers({ scope: props.mentionSearchScope });
  const editor = useEditor({
    placeholder: props.placeholder,
    className: contentClassName(props),
    handlers,
    onBlur: () => {
      setValue(editor.editor.getJSON());
    },
    onUpdate: ({ json }) => {
      setValue(json);
      if (autosaveKey) {
        try {
          if (isContentEmpty(json)) {
            sessionStorage.removeItem(autosaveKey);
            return;
          }

          sessionStorage.setItem(autosaveKey, JSON.stringify({ savedAt: Date.now(), content: json }));
        } catch (error) {
          console.warn("Failed to store rich text autosave state", error);
        }
      }
    },
    onUploadStatusChange: (status) => {
      if (status) {
        form.actions.setState("uploading");
      } else {
        form.actions.setState("idle");
      }
    },
  });

  React.useEffect(() => {
    if (editor.editor) {
      editor.editor.commands.setContent(value);
    }
  }, [editor.editor]);

  React.useEffect(() => {
    if (!autosaveKey) return;
    if (!isContentEmpty(value)) return;

    try {
      const stored = sessionStorage.getItem(autosaveKey);
      if (!stored) return;

      const parsed = JSON.parse(stored) as { savedAt?: number; content?: unknown };
      if (!parsed?.content) return;
      if (parsed.savedAt && Date.now() - parsed.savedAt > AUTOSAVE_TTL_MS) {
        sessionStorage.removeItem(autosaveKey);
        return;
      }

      setValue(parsed.content as any);
    } catch (error) {
      console.warn("Failed to restore rich text autosave state", error);
    }
  }, [autosaveKey, setValue, value]);

  return (
    <div className={wrapperClassName(props)}>
      <RichTextEditor editor={editor} hideToolbar={props.hideToolbar} hideBorder padding="p-0" />
    </div>
  );
}

function contentClassName(props: RichTextAreaProps) {
  return classNames(props.horizontalPadding, props.verticalPadding, props.fontSize, props.fontWeight, props.height);
}

function wrapperClassName(props: RichTextAreaProps & { error: boolean }) {
  return classNames({
    "w-full": true,
    "bg-surface-base text-content-accent placeholder-content-subtle": true,
    "border rounded-lg": !props.hideBorder,
    "border-surface-outline": !props.error,
    "border-red-500": props.error,
  });
}
