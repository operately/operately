import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

import PeopleSearch from "@/components/PeopleSearch";
import Forms from "@/components/Forms";

import { useLoadedData } from "./loader";
import { useForm, FormState } from "./useForm";
import { FilledButton } from "@/components/Button";
import { DimmedLink } from "@/components/Link";
import { GoalSelectorDropdown } from "@/features/goals/GoalTree/GoalSelectorDropdown";
import { Paths, compareIds } from "@/routes/paths";
import { PermissionsProvider, usePermissionsContext } from "@/features/Permissions/PermissionsContext";
import { ResourcePermissionSelector } from "@/features/Permissions";
import { useMe } from "@/contexts/CurrentUserContext";

export function Page() {
  const { spaceID, company, space } = useLoadedData();
  const form = useForm();

  return (
    <PermissionsProvider company={company} space={space || form.fields.space}>
      {spaceID ? <NewProjectForSpacePage form={form} /> : <NewProjectPage form={form} />}
    </PermissionsProvider>
  );
}

function NewProjectForSpacePage({ form }: { form: FormState }) {
  const { space, spaceID } = useLoadedData();

  const spaceProjectsPath = Paths.spaceProjectsPath(spaceID!);

  return (
    <Pages.Page title="New Project">
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={spaceProjectsPath}>Back to {space!.name} Space</DimmedLink>
        </div>

        <h1 className="mb-4 font-bold text-3xl text-center">Start a new project in {space!.name}</h1>

        <Paper.Body minHeight="300px">
          <Form form={form} />
        </Paper.Body>

        <SubmitButton form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function NewProjectPage({ form }: { form: FormState }) {
  return (
    <Pages.Page title="New Project">
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-4 gap-4">
          <DimmedLink to={Paths.projectsPath()}>Back to Projects</DimmedLink>
        </div>

        <h1 className="mb-4 font-bold text-3xl text-center">Start a new project</h1>

        <Paper.Body minHeight="300px">
          <Form form={form} />
        </Paper.Body>

        <SubmitButton form={form} />
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ form }: { form: FormState }) {
  const { permissions } = usePermissionsContext();

  return (
    <div className="mt-8">
      {form.errors.length > 0 && (
        <div className="text-content-error text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}

      <div className="flex items-center justify-center gap-4">
        <FilledButton
          type="primary"
          onClick={() => form.submit(permissions)}
          loading={form.submitting}
          size="lg"
          testId="save"
          bzzzOnClickFailure
        >
          Add Project
        </FilledButton>
      </div>
    </div>
  );
}

function Form() {
  const me = useMe()!;
  const { space, spaceOptions } = useLoadedData();

  const form = Forms.useForm({
    fields: {
      name: Forms.useTextField(),
      space: Forms.useSelectField(space?.id, spaceOptions),
      champion: Forms.useSelectPersonField(me),
      reviewer: Forms.useSelectPersonField(me.manager),
      creatorRole: Forms.useTextField(),
      creatorIsContributor: Forms.useSelectField("no", [
        { label: "No, I'm just setting it up for someone else", value: "no" },
        { label: "Yes, I'll contribute", value: "yes" },
      ]),
    },
    submit: async (form) => {
      console.log("submitting", form);
    },
  });

  const showWillYouContribute = React.useMemo(() => {
    const isChampion = compareIds(form.fields.champion?.value!.id!, me.id!);
    const isReviewer = compareIds(form.fields.reviewer?.value!.id!, me.id!);

    return !isChampion && !isReviewer;
  }, [form.fields.champion, form.fields.reviewer, me.id]);

  const showResponsibility = React.useMemo(() => {
    if (showWillYouContribute) {
      return form.fields.creatorIsContributor.value === "yes";
    } else {
      return false;
    }
  }, [showWillYouContribute, form.fields.creatorIsContributor]);

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput label="Project Name" field={"name"} placeholder="e.g. HR System Update" />
        <Forms.SelectBox label="Space" field={"space"} />

        <Forms.FieldGroup layout="grid" gridColumns={2}>
          <Forms.SelectPerson label="Champion" field={"champion"} />
          <Forms.SelectPerson label="Reviewer" field={"reviewer"} />
        </Forms.FieldGroup>

        {showWillYouContribute && <Forms.RadioButtons label="Will you contribute?" field={"creatorIsContributor"} />}
        {showResponsibility && (
          <Forms.TextInput
            label="What is your responsibility on this project?"
            field={"creatorRole"}
            placeholder="e.g. Responsible for managing the project and coordinating tasks"
          />
        )}
      </Forms.FieldGroup>
    </Forms.Form>
  );

  // return (
  //   <Forms.Form onSubmit={() => {}} loading={form.submitting} isValid={true} onCancel={form.cancel}>
  //     <div className="flex flex-col gap-8">
  //       <div>
  //         <Forms.TextInput
  //           autoFocus
  //           label="Project Name"
  //           value={form.fields.name}
  //           onChange={form.fields.setName}
  //           placeholder="e.g. HR System Update"
  //           data-test-id="project-name-input"
  //           error={!!form.errors.find((e) => e.field === "name")?.message}
  //         />
  //       </div>

  //       {allowSpaceSelection && <SpaceSelector form={form} />}

  //       <GoalSelector form={form} />

  //       <div className="grid grid-cols-2 gap-4">
  //         <ContributorSearch
  //           title="Champion"
  //           onSelect={form.fields.setChampion}
  //           defaultValue={form.fields.champion}
  //           error={!!form.errors.find((e) => e.field === "champion")?.message}
  //         />
  //         <ContributorSearch
  //           title="Reviewer"
  //           onSelect={form.fields.setReviewer}
  //           defaultValue={form.fields.reviewer}
  //           error={!!form.errors.find((e) => e.field === "reviewer")?.message}
  //         />
  //       </div>

  //       {showWillYouContribute && (
  //         <div>
  //           <div className="font-bold">Will you contribute?</div>

  //           <Forms.RadioGroup
  //             name="creatorIsContributor"
  //             defaultValue={form.fields.creatorIsContributor}
  //             onChange={form.fields.setCreatorIsContributor}
  //           >
  //             <div className="flex flex-col gap-1 mt-3">
  //               <Forms.Radio
  //                 label={"No, I'm just setting it up for someone else"}
  //                 value="no"
  //                 disabled={form.fields.visibility === "invite"}
  //                 testId="no-contributor"
  //               />
  //               <Forms.Radio label="Yes, I'll contribute" value="yes" testId="yes-contributor" />
  //             </div>
  //           </Forms.RadioGroup>

  //           {form.fields.creatorIsContributor === "yes" && (
  //             <div className="mt-4">
  //               <Forms.TextInput
  //                 label="What is your responsibility on this project?"
  //                 value={form.fields.creatorRole}
  //                 onChange={form.fields.setCreatorRole}
  //                 placeholder="e.g. Responsible for managing the project and coordinating tasks"
  //                 testId="creator-responsibility-input"
  //                 error={!!form.errors.find((e) => e.field === "creatorRole")?.message}
  //               />
  //             </div>
  //           )}
  //         </div>
  //       )}

  //       <ResourcePermissionSelector />
  //     </div>
  //   </Forms.Form>
  // );
}

function GoalSelector({ form }: { form: FormState }) {
  return (
    <div className="flex flex-col">
      <label className="font-bold mb-1 block">Goal</label>

      <GoalSelectorDropdown
        selected={form.fields.goal}
        goals={form.fields.goalOptions}
        onSelect={form.fields.setGoal}
        error={false}
      />
    </div>
  );
}
