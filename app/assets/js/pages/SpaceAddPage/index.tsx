import React from "react";

import { useNavigate } from "react-router-dom";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import Forms from "@/components/Forms";
import { useFormContext } from "@/components/Forms/FormContext";

import { AccessLevel, AccessSelectors, applyAccessLevelConstraints, initialAccessLevels } from "@/features/spaces";
import { usePaths } from "@/routes/paths";
import { PageModule } from "@/routes/types";
import { SecondaryButton } from "turboui";

export default { name: "SpaceAddPage", loader: Pages.emptyLoader, Page } as PageModule;

function Page() {
  const navigate = useNavigate();
  const [create] = Spaces.useCreateSpace();
  const paths = usePaths();

  const form = Forms.useForm({
    fields: {
      name: "",
      mission: "",
      access: initialAccessLevels(),
      showAdvancedAccess: false,
    },
    onChange: ({ newValues }) => {
      newValues.access = applyAccessLevelConstraints(newValues.access);
    },
    submit: async () => {
      const res = await create({
        name: form.values.name,
        mission: form.values.mission,
        publicPermissions: form.values.access.anonymous,
        companyPermissions: form.values.access.companyMembers,
      });

      navigate(paths.spacePath(res.group.id!));
    },
    onError: (error) => {
      const data = error.response?.data as { error?: string; message?: string } | undefined;
      const message = data?.message || "There was an unexpected error. Please try again later.";

      form.actions.addErrors({ _submit: message });
    },
  });

  return (
    <Pages.Page title="Create a new space">
      <Paper.Root size="small">
        <Paper.NavigateBack to={paths.homePath()} title="Back to Home" />
        <Title />

        <Forms.Form form={form}>
          <Paper.Body minHeight="none">
            <Forms.FieldGroup>
              <NameInput field="name" />
              <PurposeInput field="mission" />
            </Forms.FieldGroup>

            <Forms.FormError message={form.errors._submit} when={!!form.errors._submit} className="mt-4" />

            <PrivacyLevel />
          </Paper.Body>

          <Forms.Submit saveText="Create Space" layout="centered" buttonSize="base" />
        </Forms.Form>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  return (
    <div className="text-center mb-6">
      <h1 className="text-3xl font-bold">Create a new space</h1>
      <span className="text-content-dimmed">Spaces help organize projects, goals, and team members in one place.</span>
    </div>
  );
}

function NameInput({ field }: { field: string }) {
  const form = useFormContext();

  return (
    <Forms.TextInput
      label="Space Name"
      field={field}
      placeholder="e.g. Marketing"
      required
      autoFocus
      onEnter={(event) => {
        event.preventDefault();
        void form.actions.submit();
      }}
    />
  );
}

function PurposeInput({ field }: { field: string }) {
  return (
    <Forms.TextInput
      label="Purpose"
      field={field}
      placeholder="e.g. Create product awareness and bring new leads"
      required
    />
  );
}

function PrivacyLevel() {
  const [isAdvanced] = Forms.useFieldValue<boolean>("showAdvancedAccess");

  return (
    <Paper.DimmedSection>
      <div className="flex items-center justify-between">
        <PrivacyLevelTitle field={"access"} />
        <PrivacyEdit />
      </div>

      {isAdvanced && <AccessSelectors />}
    </Paper.DimmedSection>
  );
}

function PrivacyLevelTitle({ field }: { field: string }) {
  const [anonymous] = Forms.useFieldValue<number>(`${field}.anonymous`);
  const [company] = Forms.useFieldValue<number>(`${field}.companyMembers`);

  return <AccessLevel anonymous={anonymous} company={company} tense="future" hideIcon={true} />;
}

function PrivacyEdit() {
  const [isAdvanced, setIsAdvanced] = Forms.useFieldValue<boolean>("showAdvancedAccess");
  if (isAdvanced) return null;

  return (
    <SecondaryButton size="xs" onClick={() => setIsAdvanced(true)} testId="edit-access-levels">
      Edit
    </SecondaryButton>
  );
}
