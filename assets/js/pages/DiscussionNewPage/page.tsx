import React from "react";

import * as TipTapEditor from "@/components/Editor";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";

import { FilledButton } from "@/components/Button";
import { Spacer } from "@/components/Spacer";

import { useDocumentTitle } from "@/layouts/header";
import classnames from "classnames";
import { useLoadedData } from "./loader";
import { FormState, useForm } from "./useForm";

export function Page() {
  const { space } = useLoadedData();
  const form = useForm();

  useDocumentTitle(["New Discussion", space.name]);

  return (
    <Pages.Page title="New Discussion">
      <Paper.Root>
        <Navigation space={space} />

        <Paper.Body>
          <Title form={form} />
          <Message editor={form.fields.editor} />
          <Spacer size={4} />
        </Paper.Body>

        <Submit form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation({ space }) {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={`/spaces/${space.id}/discussions`}>
        {React.createElement(Icons[space.icon], { size: 16, className: space.color })}
        {space.name}
      </Paper.NavItem>
    </Paper.Navigation>
  );
}

function Submit({ form }: { form: FormState }) {
  return (
    <div className="flex justify-center items-center mt-8">
      <FilledButton loading={form.loading} data-test-id="submit-discussion-button" onClick={form.submit} size="lg">
        {form.uploading ? "Uploading..." : "Post Discussion"}
      </FilledButton>
    </div>
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
  }, [form.fields.title]);

  return (
    <textarea
      ref={textareaRef}
      autoFocus
      className={className}
      placeholder="Title&hellip;"
      value={form.fields.title}
      onChange={(e) => form.fields.setTitle(e.target.value)}
      data-test-id="discussion-title-input"
    ></textarea>
  );
}

function Message({ editor }) {
  return (
    <div className="text-lg">
      <TipTapEditor.Root>
        <TipTapEditor.Toolbar editor={editor} variant="large" />

        <div
          className="mb-8 text-content-base font-medium relative border-b border-shade-2"
          style={{ minHeight: "350px" }}
        >
          <TipTapEditor.EditorContent editor={editor} />
          <TipTapEditor.LinkEditForm editor={editor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
