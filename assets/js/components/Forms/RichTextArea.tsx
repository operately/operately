import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import { InputField } from "./FieldGroup";
import { useFieldError, useFieldValue, useFormContext } from "./FormContext";
import { useValidation } from "./validations/hook";

import classNames from "classnames";
import { validateRichContentPresence } from "./validations/richContentPresence";

interface RichTextAreaProps {
  field: string;
  label?: string;
  hidden?: boolean;
  placeholder?: string;
  hideBorder?: boolean;
  height?: string;
  mentionSearchScope: People.SearchScope;
  required?: boolean;
}

const DEFAULT_VALUES = {
  required: false,
};

export function RichTextArea(props: RichTextAreaProps) {
  props = { ...DEFAULT_VALUES, ...props };
  const error = useFieldError(props.field);

  useValidation(props.field, validateRichContentPresence(props.required));

  return (
    <InputField field={props.field} label={props.label} error={error} hidden={props.hidden}>
      <Editor
        placeholder={props.placeholder}
        field={props.field}
        error={!!error}
        mentionSearchScope={props.mentionSearchScope}
        hideBorder={props.hideBorder}
        height={props.height || "min-h-[250px]"}
      />
    </InputField>
  );
}

interface EditorProps {
  placeholder: string | undefined;
  field: string;
  error: boolean | undefined;
  mentionSearchScope: People.SearchScope;
  hideBorder?: boolean;
  height: string;
}

function Editor({ placeholder, field, error, mentionSearchScope, hideBorder, height }: EditorProps) {
  const form = useFormContext();
  const [value, setValue] = useFieldValue(field);

  const editor = TipTapEditor.useEditor({
    placeholder: placeholder,
    className: `px-3 py-2 font-medium ${height}`,
    mentionSearchScope,
    onBlur: () => {
      setValue(editor.editor.getJSON());
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

  return (
    <div className={styles(!!error, hideBorder)}>
      <TipTapEditor.Root editor={editor.editor}>
        <TipTapEditor.Toolbar editor={editor.editor} noTopBorder />
        <TipTapEditor.EditorContent editor={editor.editor} />
      </TipTapEditor.Root>
    </div>
  );
}

function styles(error: boolean | undefined, hideBorder?: boolean) {
  return classNames({
    "w-full": true,
    "bg-surface-base text-content-accent placeholder-content-subtle": true,
    "border rounded-lg": !hideBorder,
    "border-surface-outline": !error,
    "border-red-500": error,
  });
}
