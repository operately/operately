import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import { InputField } from "./FieldGroup";
import { useFieldError, useFieldValue, useFormContext } from "./FormContext";
import classNames from "classnames";

interface RichTextAreaProps {
  field: string;
  label?: string;
  hidden?: boolean;
  placeholder?: string;
  mentionSearchScope: People.SearchScope;
}

export function RichTextArea(props: RichTextAreaProps) {
  const { field, label, hidden, placeholder } = props;

  const error = useFieldError(field);

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <Editor placeholder={placeholder} field={field} error={!!error} mentionSearchScope={props.mentionSearchScope} />
    </InputField>
  );
}

interface EditorProps {
  placeholder: string | undefined;
  field: string;
  error: boolean | undefined;
  mentionSearchScope: People.SearchScope;
}

function Editor({ placeholder, field, error, mentionSearchScope }: EditorProps) {
  const form = useFormContext();
  const [value, setValue] = useFieldValue(field);

  const editor = TipTapEditor.useEditor({
    placeholder: placeholder,
    className: "min-h-[250px] px-3 py-2 font-medium",
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
    <div className={styles(!!error)}>
      <TipTapEditor.Root editor={editor.editor}>
        <TipTapEditor.Toolbar editor={editor.editor} noTopBorder />
        <TipTapEditor.EditorContent editor={editor.editor} />
      </TipTapEditor.Root>
    </div>
  );
}

function styles(error: boolean | undefined) {
  return classNames({
    "w-full": true,
    "bg-surface-base text-content-accent placeholder-content-subtle": true,
    "border rounded-lg": true,
    "border-surface-outline": !error,
    "border-red-500": error,
  });
}
