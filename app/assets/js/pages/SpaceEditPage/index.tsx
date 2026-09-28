import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";
import * as React from "react";

import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router";

import { Forms } from "turboui";
import { useTranslation } from "react-i18next";
import { translationText } from "@/i18n";

import { usePaths } from "@/routes/paths";
import { loader, useLoadedData } from "./loader";

export default { name: "SpaceEditPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const paths = usePaths();
  const navigate = useNavigate();
  const { space } = useLoadedData();

  const edit = Spaces.useEditSpace();
  const backPath = paths.spacePath(space.id);

  const form = Forms.useForm({
    fields: {
      name: space.name || "",
      purpose: space.mission || "",
    },
    submit: async () => {
      await edit.mutateAsync({
        id: space.id,
        name: form.values.name,
        mission: form.values.purpose,
      });

      navigate(backPath);
    },
    cancel: () => navigate(backPath),
  });

  return (
    <Pages.Page title={[translationText(t("Edit Space")), space.name]}>
      <Paper.Root size="small">
        <Paper.Body minHeight="none">
          <Forms.Form form={form}>
            <div className="font-extrabold text-2xl text-center mb-4">{t("Editing {{name}}", { name: space.name })}</div>
            <Forms.FieldGroup layout="vertical">
              <Forms.TextInput label={translationText(t("Name"))} field={"name"} />
              <Forms.TextInput label={translationText(t("Purpose"))} field={"purpose"} />
            </Forms.FieldGroup>
            <Forms.Submit saveText={translationText(t("Save"))} />
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
