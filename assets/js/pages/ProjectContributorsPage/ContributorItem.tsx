import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as ProjectContributors from "@/models/projectContributors";
import * as Projects from "@/models/projects";

import { ContributorAvatar } from "@/components/ContributorAvatar";

import { PERMISSIONS_LIST } from "@/features/Permissions";
import { createTestId } from "@/utils/testid";

import Forms from "@/components/Forms";
import { SecondaryButton } from "@/components/Buttons";

interface Props {
  project: Projects.Project;
  contributor: ProjectContributors.ProjectContributor;
  refetch: any;
}

export default function ContributorItem({ project, contributor, refetch }: Props) {
  return (
    <div data-test-id={`contributor-${contributor?.person!.id}`}>
      <ContributorItemContent contributor={contributor} project={project} refetch={refetch} />
    </div>
  );
}

function ContributorItemContent({ contributor, project, refetch }: Props) {
  const [state, setState] = React.useState<"view" | "edit">("view");

  const activateEdit = () => setState("edit");
  const deactivateEdit = () => setState("view");
  const onChange = async () => {
    await refetch();
    deactivateEdit();
  };

  if (state === "view") {
    return <Assignment project={project} contributor={contributor} onEdit={activateEdit} />;
  }

  if (state === "edit") {
    return <EditAssignment contributor={contributor} onSave={onChange} onRemove={onChange} onCancel={deactivateEdit} />;
  }

  throw new Error("Invalid state");
}

function Assignment({ project, contributor, onEdit }) {
  return (
    <ViewState
      project={project}
      avatar={<ContributorAvatar contributor={contributor} />}
      name={contributor.person.fullName}
      responsibility={ProjectContributors.responsibility(contributor, contributor.role)}
      onEdit={onEdit}
    />
  );
}

function ViewState({ project, avatar, name, responsibility, onEdit }) {
  const editTestId = createTestId("edit-contributor", name);

  return (
    <div className="flex items-center justify-between border-b border-stroke-dimmed py-2 group">
      <div className="flex items-center gap-2">
        {avatar}

        <div className="flex flex-col flex-1">
          <div className="font-bold">{name}</div>
          <div className="text-sm font-medium flex items-center gap-1">{responsibility}</div>
        </div>
      </div>

      {project.permissions.canEditContributors && (
        <div className="shrink-0">
          <div
            className="rounded-full p-2 hover:bg-surface-dimmed transition-colors"
            onClick={onEdit}
            data-test-id={editTestId}
          >
            <Icons.IconPencil
              size={20}
              className="cursor-pointer text-content-subtle hover:text-content-accent transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EditAssignment({ contributor, onSave, onRemove, onCancel }) {
  const [update] = Projects.useUpdateProjectContributor();
  const [remove, { loading }] = Projects.useRemoveProjectContributor();

  const form = Forms.useForm({
    fields: {
      person: Forms.useSelectPersonField(contributor.person),
      responsibility: Forms.useTextField(ProjectContributors.responsibility(contributor, contributor.role)),
      permissions: Forms.useSelectNumberField(contributor.accessLevel, PERMISSIONS_LIST),
    },
    submit: async (form) => {
      await update({
        contribId: contributor.id,
        personId: form.fields.person.value!.id!,
        responsibility: form.fields.responsibility.value!,
        permissions: form.fields.permissions.value,
      });

      onSave();
    },
    cancel: async () => {
      onCancel();
    },
  });

  const handleRemove = async () => {
    await remove({ contribId: contributor.id });
    onRemove();
  };

  const hideResp = !ProjectContributors.isResponsibilityEditable(contributor.role);
  const hidePermissions = !ProjectContributors.isPermissionsEditable(contributor.role);
  const showRemove = ProjectContributors.isResponsibilityRemovable(contributor.role);

  return (
    <Forms.Form form={form}>
      <div className="bg-surface-dimmed border-y border-surface-outline -mx-12 px-12 py-8">
        <Forms.FieldGroup>
          <Forms.SelectPerson field={"person"} label="Contributor" />
          <Forms.TextInput
            field={"responsibility"}
            placeholder="e.g. Project Manager"
            label="Responsibility"
            hidden={hideResp}
          />
          <Forms.SelectBox field={"permissions"} label="Access Level" hidden={hidePermissions} />
        </Forms.FieldGroup>

        <Forms.Submit saveText="Save" cancelText="Cancel" />

        {showRemove && <RemoveButton onClick={handleRemove} loading={loading} />}
      </div>
    </Forms.Form>
  );
}

export function RemoveButton({ onClick, loading }) {
  return (
    <div className="flex gap-2">
      <SecondaryButton onClick={onClick} loading={loading} testId="remove-contributor">
        Remove
      </SecondaryButton>
    </div>
  );
}
