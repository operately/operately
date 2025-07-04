import * as Forms from "@/components/Form";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as KeyResources from "@/models/keyResources";
import * as React from "react";

import { ResourceIcon } from "@/components/KeyResourceIcon";
import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { useLoadedData, useResourceTypeParam } from "./loader";
import { useForm } from "./useForm";

import { usePaths } from "@/routes/paths";
export function Page() {
  const { project } = useLoadedData();
  const resourceType = useResourceTypeParam();
  const form = useForm(project, resourceType);

  const title = KeyResources.humanTitle(resourceType);

  return (
    <Pages.Page title={["Add Resource", project.name!]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />

        <Paper.Body minHeight="none">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-extrabold mb-8">Adding a {title}</h1>
            <ResourceIcon resourceType={resourceType} size={48} />
          </div>

          <Form project={project} form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ project, form }) {
  const paths = usePaths();
  const onCancel = useNavigateTo(paths.projectEditResourcesPath(project.id));
  const namePlaceholder = KeyResources.placeholderName(form.resourceType);

  return (
    <Forms.Form onSubmit={form.submit} isValid={form.isValid} onCancel={onCancel}>
      <Forms.TextInput
        name="name"
        label="Name"
        placeholder={namePlaceholder}
        value={form.name}
        onChange={form.setName}
        autoFocus
        error={false}
      />

      <Forms.TextInput
        name="url"
        label="URL"
        placeholder="https://..."
        value={form.url}
        onChange={form.setUrl}
        error={false}
      />

      <Forms.SubmitArea>
        <Forms.SubmitButton testId="save">Save</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
