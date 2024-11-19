import React from "react";
import { useNavigate } from "react-router-dom";

import { useCreateResourceHubDocument } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { useLoadedData } from "./loader";

export function Form() {
  const { resourceHub } = useLoadedData();
  const navigate = useNavigate();
  const [post] = useCreateResourceHubDocument();

  const form = Forms.useForm({
    fields: {
      title: "",
      content: null,
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
      navigate(Paths.spaceResourceHubPath(resourceHub.space!.id!, resourceHub.id!));
    },
    submit: async () => {
      await post({
        resourceHubId: resourceHub.id,
        name: form.values.title,
        content: JSON.stringify(form.values.content),
      });
      // This redirect is temporary.
      // Once we have the document page, the user will be redirected to it.
      navigate(Paths.spaceResourceHubPath(resourceHub.space!.id!, resourceHub.id!));
    },
  });

  const mentionSearchScope = { type: "resource_hub", id: resourceHub.id! } as const;

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
      <Forms.Submit saveText="Submit" buttonSize="base" />
    </Forms.Form>
  );
}
