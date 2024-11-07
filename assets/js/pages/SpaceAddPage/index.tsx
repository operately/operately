import React from "react";

import { useNavigate } from "react-router-dom";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import Forms from "@/components/Forms";

import { Paths } from "@/routes/paths";
import { SecondaryButton } from "@/components/Buttons";
import { AccessLevel, AccessSelectors, initialAccessLevels, applyAccessLevelConstraints } from "@/features/spaces";

export const loader = Pages.emptyLoader;

export function Page() {
  const navigate = useNavigate();
  const [create] = Spaces.useCreateSpace();

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

      navigate(Paths.spacePath(res.group.id!));
    },
  });

  return (
    <Pages.Page title="Create a new space">
      <Paper.Root size="small">
        <Paper.NavigateBack to={Paths.homePath()} title="Back to Home" />
        <Title />

        <Forms.Form form={form}>
          <Paper.Body minHeight="none">
            <Forms.FieldGroup>
              <NameInput field="name" />
              <PurposeInput field="mission" />
            </Forms.FieldGroup>

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
  return <Forms.TextInput label="Space Name" field={field} placeholder="e.g. Marketing Team" required />;
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
