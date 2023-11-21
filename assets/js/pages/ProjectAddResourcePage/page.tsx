import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Forms from "@/components/Form";
import * as KeyResources from "@/models/key_resources";

import { useLoadedData } from "./loader";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ResourceIcon } from "@/components/KeyResourceIcon";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { createPath } from "@/utils/paths";
import { useSearchParams } from "react-router-dom";

import { useForm } from "./useForm";

export function Page() {
  const { project } = useLoadedData();
  const [searchParams] = useSearchParams();
  const resourceType = searchParams.get("resourceType") || "generic";
  const title = KeyResources.humanTitle(resourceType);

  const form = useForm();
  const onCancel = useNavigateTo(createPath("projects", project.id, "edit", "resources"));

  return (
    <Pages.Page title={["Add Resource", project.name]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />

        <Paper.Body minHeight="none">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-extrabold mb-8">Adding a {title}</h1>
            <ResourceIcon resourceType={resourceType} size={48} />
          </div>

          <Forms.Form onSubmit={form.submit} isValid={form.isValid} onCancel={onCancel}>
            <Forms.TextInput
              name="name"
              label="Name"
              placeholder={KeyResources.placeholderName(resourceType)}
              value={form.name}
              onChange={form.setName}
              autoFocus
            />
            <Forms.TextInput name="url" label="URL" placeholder="https://..." value={form.url} onChange={form.setUrl} />

            <Forms.SubmitArea>
              <Forms.SubmitButton>Save</Forms.SubmitButton>
              <Forms.CancelButton>Cancel</Forms.CancelButton>
            </Forms.SubmitArea>
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
