import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Icons from "@tabler/icons-react";
import * as Forms from "@/components/Form";

import { useForm, FormState } from "./useForm";
import { useLoadedData } from "./loader";
import { FilledButton } from "@/components/Button";
import { Link } from "@/components/Link";

export function Page() {
  const { group } = useLoadedData();
  const form = useForm(group);

  return (
    <Pages.Page title={["Appearance Settings", group.name]}>
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-2">
          <Link to={`/spaces/${group.id}`}>
            <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
            Back to the {group.name} Space
          </Link>
        </div>

        <Paper.Body minHeight="none">
          <div className="font-extrabold text-2xl text-center">Editing {group.name}</div>

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
    <div className="flex items-center justify-center mt-8">
      <FilledButton onClick={form.submit} testId="save">
        Save
      </FilledButton>
    </div>
  );
}
