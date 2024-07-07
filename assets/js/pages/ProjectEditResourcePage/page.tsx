import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Forms from "@/components/Form";
import * as KeyResources from "@/models/keyResources";

import { ProjectPageNavigation } from "@/components/ProjectPageNavigation";
import { ResourceIcon } from "@/components/KeyResourceIcon";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { useLoadedData } from "./loader";
import { useForm } from "./useForm";
import { Paths } from "@/routes/paths";

export function Page() {
  const { project, keyResource } = useLoadedData();
  const form = useForm(project, keyResource);

  return (
    <Pages.Page title={["Edit", keyResource.title!, project.name!]}>
      <Paper.Root size="small">
        <ProjectPageNavigation project={project} />

        <Paper.Body minHeight="none">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-extrabold mb-8">Editing {keyResource.title}</h1>
            <ResourceIcon resourceType={keyResource.resourceType!} size={48} />
          </div>

          <Form project={project} form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form({ project, form }) {
  const onCancel = useNavigateTo(Paths.projectEditResourcesPath(project.id!));
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
        <Forms.SubmitButton data-test-id="save">Save</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
