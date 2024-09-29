import * as React from "react";
import * as TipTapEditor from "@/components/Editor";

import { InputField } from "./FieldGroup";
import { useFieldError, useFieldValue, useFormContext } from "./FormContext";
import classNames from "classnames";

interface RichTextAreaProps {
  field: string;
  label?: string;
  hidden?: boolean;
  placeholder?: string;
}

export function RichTextArea(props: RichTextAreaProps) {
  const { field, label, hidden, placeholder } = props;

  const error = useFieldError(field);

  return (
    <InputField field={field} label={label} error={error} hidden={hidden}>
      <Editor placeholder={placeholder} field={field} error={!!error} />
    </InputField>
  );
}

interface EditorProps {
  placeholder: string | undefined;
  field: string;
  error: boolean | undefined;
}

function Editor({ placeholder, field, error }: EditorProps) {
  const form = useFormContext();
  const [value, setValue] = useFieldValue(field);

  const editor = TipTapEditor.useEditor({
    placeholder: placeholder,
    className: "min-h-[250px] px-3 py-2 font-medium",
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
  }, [value, editor.editor]);

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
    "bg-surface text-content-accent placeholder-content-subtle": true,
    "border rounded-lg": true,
    "border-surface-outline": !error,
    "border-red-500": error,
  });
}
