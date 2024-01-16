import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as TipTapEditor from "@/components/Editor";

import Button from "@/components/Button";
import { Spacer } from "@/components/Spacer";

import { useDocumentTitle } from "@/layouts/header";
import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";
import classnames from "classnames";

export function Page() {
  const { space } = useLoadedData();
  const form = useForm();

  useDocumentTitle(["New Discussion", space.name]);

  const submitDisabled = form.uploading || !form.title || form.empty;

  return (
    <Paper.Root>
      <Paper.Navigation>
        <Paper.NavItem linkTo={`/projects/${space.id}`}>{space.name}</Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body>
        <Title form={form} />
        <Message editor={form.editor} />
        <Spacer size={4} />

        <Button
          variant="success"
          disabled={submitDisabled}
          loading={form.loading}
          data-test-id="submit-discussion-button"
          onClick={form.submit}
        >
          {form.uploading ? "Uploading..." : "Post this message"}
        </Button>
      </Paper.Body>
    </Paper.Root>
  );
}

function Title({ form }: { form: FormState }) {
  const className = classnames(
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
      data-test-id="discussion-title-input"
    ></textarea>
  );
}

function Message({ editor }) {
  return (
    <div className="text-lg">
      <TipTapEditor.Root>
        <TipTapEditor.Toolbar editor={editor} variant="large" />

        <div className="mb-8 text-white-1 relative border-b border-shade-2" style={{ minHeight: "350px" }}>
          <TipTapEditor.EditorContent editor={editor} />
          <TipTapEditor.LinkEditForm editor={editor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
