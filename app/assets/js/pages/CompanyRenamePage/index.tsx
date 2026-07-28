import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";
import * as React from "react";

import { Forms, Page as TurboUIPage } from "turboui";
import { PageModule } from "@/routes/types";
import { useNavigate, useRevalidator } from "react-router";

import { usePaths } from "@/routes/paths";
export default { name: "CompanyRenamePage", loader, Page } as PageModule;

interface LoaderResult {
  company: Companies.Company;
}

async function loader(): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany({}).then((d) => d.company!),
  };
}

function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const { company } = Pages.useLoadedData<LoaderResult>();
  const [edit] = Companies.useEditCompany();

  const form = Forms.useForm({
    fields: {
      name: company.name,
    },
    submit: async () => {
      await edit({ name: form.values.name });

      navigate(paths.companyAdminPath());
      revalidate();
    },
    cancel: () => navigate(paths.companyAdminPath()),
  });

  return (
    <TurboUIPage
      title={"Rename Company"}
      size="small"
      testId="company-rename-page"
      navigation={[{ to: paths.companyAdminPath(), label: "Company Administration" }]}
    >
      <div className="px-10 py-8">
        <Forms.Form form={form}>
          <div className="mb-6 text-content-accent text-2xl font-extrabold">Editing Company Name</div>

          <Forms.FieldGroup>
            <Forms.TextInput label="Company Name" field={"name"} minLength={2} maxLength={100} />
          </Forms.FieldGroup>

          <Forms.Submit saveText="Save" />
        </Forms.Form>
      </div>
    </TurboUIPage>
  );
}
