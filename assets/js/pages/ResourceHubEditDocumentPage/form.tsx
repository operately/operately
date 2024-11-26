import React from "react";
import { useNavigate } from "react-router-dom";

import { useEditResourceHubDocument, ResourceHubDocument } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";

export function Form({ document }: { document: ResourceHubDocument }) {
  const navigate = useNavigate();
  const [edit] = useEditResourceHubDocument();

  const form = Forms.useForm({
    fields: {
      title: document.name,
      content: JSON.parse(document.content!),
    },
    validate: (addError) => {
      if (!form.values.title) {
        addError("title", "Title is required");
      }
      if (!form.values.content) {
        addError("content", "Content is required");
      }
    },
    cancel: () => {
      navigate(Paths.resourceHubDocumentPath(document.id!));
    },
    submit: async () => {
      const res = await edit({
        documentId: document.id!,
        name: form.values.title,
        content: JSON.stringify(form.values.content),
      });
      navigate(Paths.resourceHubDocumentPath(res.document.id));
    },
  });

  const mentionSearchScope = { type: "resource_hub", id: document.resourceHubId! } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TitleInput field="title" placeholder="Title..." />
        <Forms.RichTextArea
          field="content"
          mentionSearchScope={mentionSearchScope}
          placeholder="Write here..."
          hideBorder
        />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save" buttonSize="base" />
    </Forms.Form>
  );
}
