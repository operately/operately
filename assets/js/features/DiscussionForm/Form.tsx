import React from "react";

import classnames from "classnames";
import * as TipTapEditor from "@/components/Editor";
import { Spacer } from "@/components/Spacer";
import { FormState } from "./useForm";

export function Form({ form }: { form: FormState }) {
  return (
    <>
      <Title form={form} />
      <Message editor={form.editor} />
      <Spacer size={4} />
    </>
  );
}

function Title({ form }: { form: FormState }) {
  const className = classnames(
    "bg-surface",
    "text-3xl",
    "font-semibold",
    "border-none",
    "outline-none",
    "focus:outline-none",
    "focus:ring-0",
    "px-0 py-1",
    "w-full",
    "resize-none",
    "ring-0",
    "placeholder:text-content-subtle",
    "leading-wide",
    {
      "bg-red-400/10": form.errors.find((e) => e.field === "name"),
    },
  );

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "0px";
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = scrollHeight + "px";
  }, [form.title]);

  return (
    <textarea
      ref={textareaRef}
      autoFocus
      className={className}
      placeholder="Title&hellip;"
      value={form.title}
      onChange={(e) => form.setTitle(e.target.value)}
      data-test-id="discussion-title"
    ></textarea>
  );
}

function Message({ editor }) {
  return (
    <div className="text-lg">
      <TipTapEditor.Root editor={editor}>
        <TipTapEditor.Toolbar editor={editor} />

        <div
          className="mb-8 text-content-base font-medium relative border-b border-shade-2"
          style={{ minHeight: "350px" }}
        >
          <TipTapEditor.EditorContent editor={editor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
