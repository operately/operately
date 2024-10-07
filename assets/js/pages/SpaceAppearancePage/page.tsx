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
    cancel: goToSpace,
  });

  return (
    <Pages.Page title={["Appearance Settings", space.name!]}>
      <Paper.Root size="small">
        <Paper.NavigateBack to={Paths.spacePath(space.id!)} title={`Back to ${space.name} Space`} />

        <Paper.Body minHeight="none">
          <div className="font-extrabold text-2xl text-center">Appearance of {space.name}</div>

          <Forms.Form form={form}>
            <div className="h-px bg-stroke-base my-8"></div>
            <ColorChooser field="color" />

            <div className="h-px bg-stroke-base my-8"></div>
            <IconChooser iconField="icon" colorField="color" />

            <div className="h-px bg-stroke-base my-8"></div>
            <Forms.Submit saveText="Save Changes" />
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
