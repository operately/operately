import React from "react";
import { useNavigate } from "react-router-dom";

import { useEditResourceHubDocument, ResourceHubDocument, usePublishResourceHubDocument } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { Paths } from "@/routes/paths";
import { areRichTextObjectsEqual } from "@/components/RichContent";

export function Form({ document }: { document: ResourceHubDocument }) {
  const navigate = useNavigate();
  const [edit] = useEditResourceHubDocument();
  const [publish] = usePublishResourceHubDocument();

  const form = Forms.useForm({
    fields: {
      title: document.name!,
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
    submit: async (type) => {
      const { title, content } = form.values;

      if (type == "primary") {
        if (documentHasChanged(document, title, content)) {
          await edit({
            documentId: document.id,
            name: title,
            content: JSON.stringify(content),
          });
        }
      } else if (type == "secondary") {
        await publish({ documentId: document.id });
      }

      navigate(Paths.resourceHubDocumentPath(document.id!));
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

      <Forms.Submit saveText="Save Changes" secondarySubmitText="Publish Now" buttonSize="base" />
    </Forms.Form>
  );
}

function documentHasChanged(document: ResourceHubDocument, name: string, content: any) {
  if (document.name !== name) return true;
  if (!areRichTextObjectsEqual(JSON.parse(document.content!), content)) return true;
  return false;
}
