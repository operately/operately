import { loader, useLoadedData } from "./loader";
import * as Companies from "@/models/companies";
import * as React from "react";

import { Forms, Page as TurboUIPage } from "turboui";
import { PageModule } from "@/routes/types";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";

import { translationText } from "@/i18n";
import { usePaths } from "@/routes/paths";
export default { name: "CompanyRenamePage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const paths = usePaths();
  const navigate = useNavigate();
  const { company } = useLoadedData();
  const { mutateAsync: edit } = Companies.useEditCompany();

  const form = Forms.useForm({
    fields: {
      name: company.name,
    },
    submit: async () => {
      await edit({ name: form.values.name });

      navigate(paths.companyAdminPath());
    },
    cancel: () => navigate(paths.companyAdminPath()),
  });

  return (
    <TurboUIPage
      title={translationText(t("Rename Company"))}
      size="small"
      testId="company-rename-page"
      navigation={[{ to: paths.companyAdminPath(), label: t("Company Administration") }]}
    >
      <div className="px-10 py-8">
        <Forms.Form form={form}>
          <div className="mb-6 text-content-accent text-2xl font-extrabold">{t("Editing Company Name")}</div>

          <Forms.FieldGroup>
            <Forms.TextInput label={translationText(t("Company Name"))} field={"name"} minLength={2} maxLength={100} />
          </Forms.FieldGroup>

          <Forms.Submit saveText={translationText(t("Save"))} />
        </Forms.Form>
      </div>
    </TurboUIPage>
  );
}
