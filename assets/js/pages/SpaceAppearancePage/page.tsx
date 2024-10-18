import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import { useLoadedData } from "./loader";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { ColorChooser, IconChooser } from "@/features/spaces";
import { Paths } from "@/routes/paths";
import Forms from "@/components/Forms";

export function Page() {
  const { space } = useLoadedData();
  const goToSpace = useNavigateTo(Paths.spacePath(space.id!));
  const [update] = Spaces.useUpdateGroupAppearance();

  const form = Forms.useForm({
    fields: {
      icon: space.icon,
      color: space.color,
    },
    submit: async () => {
      await update({
        id: space.id,
        color: form.values.color,
        icon: form.values.icon,
      });

      goToSpace();
    },
  });

  return (
    <Pages.Page title={["Appearance Settings", space.name!]}>
      <Paper.Root size="small">
        <Paper.NavigateBack to={Paths.spacePath(space.id!)} title={`Back to ${space.name} Space`} />
        <div className="font-extrabold text-2xl text-center mb-4">Appearance of {space.name}</div>

        <Forms.Form form={form}>
          <Paper.Body minHeight="none">
            <Forms.FieldGroup>
              <ColorChooser field="color" />
              <IconChooser iconField="icon" colorField="color" />
            </Forms.FieldGroup>
          </Paper.Body>

          <Forms.Submit saveText="Save Changes" buttonSize="base" layout="centered" />
        </Forms.Form>
      </Paper.Root>
    </Pages.Page>
  );
}
