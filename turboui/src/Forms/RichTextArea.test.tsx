import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { Form } from "./Form";
import { RichTextArea } from "./RichTextArea";
import { Submit } from "./Submit";
import { TitleInput } from "./TitleInput";
import { useForm } from "./useForm";
import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";

const url = "http://localhost:4100/operately-0big/projects/launch-customer-referral-EwQh6iWhvcvMDGDo6zt2Yp";
const handlers = createMockRichEditorHandlers();

it("keeps a pasted project link when immediately submitting a new discussion", async () => {
  const submit = jest.fn();

  function DiscussionForm() {
    const form = useForm({ fields: { title: "", body: emptyContent() }, submit: async () => submit(form.values) });

    return (
      <Form form={form}>
        <TitleInput field="title" testId="discussion-title" />
        <RichTextArea field="body" richTextHandlers={handlers} localDraftKey={null} />
        <Submit saveText="Post" />
      </Form>
    );
  }

  const { container } = render(
    <MemoryRouter>
      <DiscussionForm />
    </MemoryRouter>,
  );
  const editable = container.querySelector('[contenteditable="true"]');
  if (!editable) throw new Error("Editor did not mount");

  fireEvent.change(screen.getByRole("textbox"), { target: { value: "Project link" } });
  fireEvent.paste(editable, {
    clipboardData: {
      getData: (type: string) => (type === "text/plain" ? url : ""),
      items: [],
      files: [],
    },
  });
  expect(editable.querySelector("a")?.getAttribute("href")).toBe(url);
  fireEvent.click(screen.getByRole("button", { name: "Post" }));

  await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
  expect(submit.mock.calls[0][0].body.content[0].content).toMatchObject([
    { text: url, marks: [{ type: "link", attrs: { href: url } }] },
  ]);
});
