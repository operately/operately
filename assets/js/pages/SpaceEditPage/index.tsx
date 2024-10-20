import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";

import Forms from "@/components/Forms";

interface LoaderResult {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    space: await Spaces.getSpace({ id: params.id }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function Page() {
  const navigate = useNavigate();
  const { space } = useLoadedData();

  const [edit] = Spaces.useEditGroup();
  const backPath = Paths.spacePath(space.id!);

  const form = Forms.useForm({
    fields: {
      name: space.name || "",
      purpose: space.mission || "",
    },
    submit: async () => {
      await edit({
        id: space.id!,
        name: form.values.name,
        mission: form.values.purpose,
      });

      navigate(backPath);
    },
    cancel: () => navigate(backPath),
  });

  return (
    <Pages.Page title={["Edit Space", space.name!]}>
      <Paper.Root size="small">
        <Paper.Body minHeight="none">
          <Forms.Form form={form}>
            <div className="font-extrabold text-2xl text-center mb-4">Editing {space.name}</div>
            <Forms.FieldGroup layout="vertical">
              <Forms.TextInput label="Name" field={"name"} />
              <Forms.TextInput label="Purpose" field={"purpose"} />
            </Forms.FieldGroup>
            <Forms.Submit saveText="Save" />
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
