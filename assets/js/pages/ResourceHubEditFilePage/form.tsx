import React from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHubFile, useEditResourceHubFile } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";

export function Form({ file }: { file: ResourceHubFile }) {
  const navigate = useNavigate();
  const [edit] = useEditResourceHubFile();

  const form = Forms.useForm({
    fields: {
      title: file.name,
      description: JSON.parse(file.description!),
    },
    validate: (addError) => {
      if (!form.values.title) {
        addError("title", "Title is required");
      }
      if (!form.values.description) {
        addError("description", "Description is required");
      }
    },
    cancel: () => {
      navigate(Paths.resourceHubFilePath(file.id!));
    },
    submit: async () => {
      const res = await edit({
        fileId: file.id,
        name: form.values.title,
        description: JSON.stringify(form.values.description),
      });
      navigate(Paths.resourceHubFilePath(res.file.id));
    },
  });

  const mentionSearchScope = { type: "resource_hub", id: file.resourceHubId! } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TitleInput field="title" placeholder="Title..." />
        <Forms.RichTextArea
          field="description"
          mentionSearchScope={mentionSearchScope}
          placeholder="Write here..."
          hideBorder
        />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save" buttonSize="base" />
    </Forms.Form>
  );
}