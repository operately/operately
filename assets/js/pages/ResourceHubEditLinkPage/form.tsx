import React from "react";
import { useNavigate } from "react-router-dom";

import { useEditResourceHubLink } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { isValidURL } from "@/utils/validators";

import { useLoadedData } from "./loader";

export function Form() {
  const { link } = useLoadedData();
  const navigate = useNavigate();
  const [edit] = useEditResourceHubLink();

  assertPresent(link.name, "name must be present in link");
  assertPresent(link.url, "url must be present in link");
  assertPresent(link.resourceHubId, "resourceHubId must be present in link");

  const form = Forms.useForm({
    fields: {
      title: link.name,
      link: link.url,
      description: JSON.parse(link.description!),
    },
    validate: (addError) => {
      if (!form.values.title) {
        addError("title", "Title is required");
      }
      if (!form.values.link) {
        addError("link", "Link is required");
      }
      if (!isValidURL(form.values.link)) {
        addError("link", "Invalid link");
      }
    },
    cancel: () => {
      navigate(Paths.resourceHubLinkPath(link.id!));
    },
    submit: async () => {
      await edit({
        linkId: link.id,
        name: form.values.title,
        url: form.values.link,
        description: JSON.stringify(form.values.description),
        type: link.type,
      });
      navigate(Paths.resourceHubLinkPath(link.id!));
    },
  });

  const mentionSearchScope = { type: "resource_hub", id: link.resourceHubId } as const;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput
          autoFocus
          label="What do you want to call this link?"
          placeholder="Type the title of this link"
          field="title"
        />

        <Forms.TextInput label="Paste the link" placeholder="eg. https://www.example.com/file/8430762" field="link" />

        <Forms.RichTextArea
          label="Notes (optional)"
          field="description"
          mentionSearchScope={mentionSearchScope}
          placeholder="Add any notes here..."
        />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Submit" buttonSize="base" />
    </Forms.Form>
  );
}
