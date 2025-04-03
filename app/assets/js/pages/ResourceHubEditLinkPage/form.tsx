import React from "react";
import { useNavigate } from "react-router-dom";

import { ResourceHubLink, useEditResourceHubLink } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { isValidURL } from "@/utils/validators";

import { useLoadedData } from "./loader";
import { areRichTextObjectsEqual } from "@/components/RichContent";

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
      url: link.url,
      description: JSON.parse(link.description!),
    },
    validate: (addError) => {
      if (!form.values.title) {
        addError("title", "Title is required");
      }
      if (!form.values.url) {
        addError("url", "Link is required");
      }
      if (!isValidURL(form.values.url)) {
        addError("link", "Invalid link");
      }
    },
    cancel: () => {
      navigate(Paths.resourceHubLinkPath(link.id!));
    },
    submit: async () => {
      const { title, url, description } = form.values;

      if (linkHasChanged(link, title, url, description)) {
        await edit({
          linkId: link.id,
          name: title,
          url: url,
          description: JSON.stringify(description),
          type: link.type,
        });
        navigate(Paths.resourceHubLinkPath(link.id!));
      } else {
        navigate(Paths.resourceHubLinkPath(link.id!));
      }
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

        <Forms.TextInput label="Paste the link" placeholder="eg. https://www.example.com/file/8430762" field="url" />

        <Forms.RichTextArea
          label="Notes (optional)"
          field="description"
          mentionSearchScope={mentionSearchScope}
          placeholder="Add any notes here..."
        />
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save" buttonSize="base" />
    </Forms.Form>
  );
}

function linkHasChanged(file: ResourceHubLink, name: string, url: string, description: any) {
  if (file.name !== name) return true;
  if (file.url !== url) return true;
  if (!areRichTextObjectsEqual(JSON.parse(file.description!), description)) return true;
  return false;
}
