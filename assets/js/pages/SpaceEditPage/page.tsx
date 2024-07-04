import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Forms from "@/components/Form";

import { useForm, FormState } from "./useForm";
import { useLoadedData } from "./loader";
import { FilledButton } from "@/components/Button";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";

export function Page() {
  const { space } = useLoadedData();
  const form = useForm(space);

  return (
    <Pages.Page title={["Appearance Settings", space.name!]}>
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-2">
          <Link to={Paths.spacePath(space.id!)}>
            <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
            Back to the {space.name} Space
          </Link>
        </div>

        <Paper.Body minHeight="none">
          <div className="font-extrabold text-2xl text-center">Editing {space.name}</div>

          <div className="my-8 flex flex-col gap-4">
            <Forms.TextInput
              label="Name"
              value={form.fields.name}
              onChange={form.fields.setName}
              error={form.errors.find((e) => e.field === "name")}
            />

            <Forms.TextInput
              label="Purpose"
              value={form.fields.purpose}
              onChange={form.fields.setPurpose}
              error={form.errors.find((e) => e.field === "purpose")}
            />
          </div>

          <SubmitButton form={form} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ form }: { form: FormState }) {
  return (
    <div className="mt-8">
      {form.errors.length > 0 && (
        <div className="text-red-500 text-sm font-medium text-center mb-4">Please fill out all fields</div>
      )}
      <div className="flex items-center justify-center">
        <FilledButton onClick={form.submit} testId="save" bzzzOnClickFailure>
          Save
        </FilledButton>
      </div>
    </div>
  );
}
