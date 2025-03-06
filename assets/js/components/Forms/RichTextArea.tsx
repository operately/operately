import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import RichContent from "@/components/RichContent";
import { InputField } from "./FieldGroup";
import { useFieldError, useFieldValue, useFormContext } from "./FormContext";
import { useValidation } from "./validations/hook";

import classNames from "classnames";
import { validateRichContentPresence } from "./validations/richContentPresence";

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
}

const DEFAULT_VALUES = {
  required: false,
  horizontalPadding: "px-3",
  verticalPadding: "py-2",
  fontSize: "text-base",
  fontWeight: "font-medium",
  height: "min-h-[250px]",
};

export function RichTextArea(props: RichTextAreaProps) {
  props = { ...DEFAULT_VALUES, ...props };
  const error = useFieldError(props.field);

  useValidation(props.field, validateRichContentPresence(props.required));

  return (
    <InputField field={props.field} label={props.label} error={error} hidden={props.hidden}>
      {props.readonly ? <ReadonlyContent field={props.field} /> : <Editor {...props} error={!!error} />}
    </InputField>
  );
}

function ReadonlyContent({ field }: { field: string }) {
  const [value] = useFieldValue(field);

  return (
    <div className="border-surface-outline">
      <RichContent jsonContent={value} skipParse />
    </div>
  );
}

function Editor(props: RichTextAreaProps & { error: boolean }) {
  const form = useFormContext();
  const [value, setValue] = useFieldValue(props.field);

  const editor = TipTapEditor.useEditor({
    placeholder: props.placeholder,
    className: contentClassName(props),
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
    <div className={wrapperClassName(props)}>
      <TipTapEditor.Root editor={editor.editor}>
        <TipTapEditor.Toolbar editor={editor.editor} noTopBorder={!props.showToolbarTopBorder} />
        <TipTapEditor.EditorContent editor={editor.editor} />
      </TipTapEditor.Root>
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
