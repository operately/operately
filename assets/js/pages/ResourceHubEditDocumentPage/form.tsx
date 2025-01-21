import React from "react";
import { useNavigate } from "react-router-dom";

import { useEditResourceHubDocument, ResourceHubDocument, usePublishResourceHubDocument } from "@/models/resourceHubs";

import Forms from "@/components/Forms";
import { useFormContext } from "@/components/Forms/FormContext";
import { areRichTextObjectsEqual } from "@/components/RichContent";
import { Paths } from "@/routes/paths";

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
    submit: async (type: "save" | "publish-draft") => {
      const { title, content } = form.values;

      if (type === "save") {
        if (documentHasChanged(document, title, content)) {
          await edit({
            documentId: document.id,
            name: title,
            content: JSON.stringify(content),
          });
        }
      } else if (type === "publish-draft") {
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

      <FormActions document={document} />
    </Forms.Form>
  );
}

function FormActions({ document }: { document: ResourceHubDocument }) {
  const form = useFormContext();

  return (
    <div className="flex items-center justify-start gap-4 mt-8">
      <Forms.Button
        name="submit"
        text="Save Changes"
        buttonSize="base"
        primary
        onClick={() => form.actions.submit("save")}
      />
      {document.state === "draft" && (
        <Forms.Button
          name="publish-draft"
          text="Publish Now"
          buttonSize="base"
          onClick={() => form.actions.submit("publish-draft")}
        />
      )}
    </div>
  );
}

function documentHasChanged(document: ResourceHubDocument, name: string, content: any) {
  if (document.name !== name) return true;
  if (!areRichTextObjectsEqual(JSON.parse(document.content!), content)) return true;
  return false;
}
