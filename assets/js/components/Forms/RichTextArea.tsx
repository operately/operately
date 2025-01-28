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
  showToolbarTopBorder?: boolean;
  height?: string;
  mentionSearchScope: People.SearchScope;
  required?: boolean;

  horizontalPadding?: string;
  verticalPadding?: string;
  fontSize?: string;
  fontWeight?: string;
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
        showToolbarTopBorder={props.showToolbarTopBorder}
        height={props.height || "min-h-[250px]"}
        horizontalPadding={props.horizontalPadding}
        verticalPadding={props.verticalPadding}
        fontSize={props.fontSize}
        fontWeight={props.fontWeight}
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
  showToolbarTopBorder?: boolean;
  height: string;

  horizontalPadding?: string;
  verticalPadding?: string;
  fontSize?: string;
  fontWeight?: string;
}

const DEFAULT_EDITOR_PROPS = {
  horizontalPadding: "px-3",
  verticalPadding: "py-2",
  fontSize: "text-base",
  fontWeight: "font-medium",
};

function Editor(props: EditorProps) {
  props = { ...DEFAULT_EDITOR_PROPS, ...props };

  const form = useFormContext();
  const [value, setValue] = useFieldValue(props.field);

  const className = classNames(
    props.horizontalPadding,
    props.verticalPadding,
    props.fontSize,
    props.fontWeight,
    props.height,
  );

  const editor = TipTapEditor.useEditor({
    placeholder: props.placeholder,
    className: className,
    mentionSearchScope: props.mentionSearchScope,
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
    <div className={styles(!!props.error, props.hideBorder)}>
      <TipTapEditor.Root editor={editor.editor}>
        <TipTapEditor.Toolbar editor={editor.editor} noTopBorder={!props.showToolbarTopBorder} />
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
