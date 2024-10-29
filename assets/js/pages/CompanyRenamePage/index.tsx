import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Companies from "@/models/companies";

import { Paths } from "@/routes/paths";
import Forms from "@/components/Forms";
import { useNavigate, useRevalidator } from "react-router-dom";

interface LoaderResult {
  company: Companies.Company;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
  };
}

export function Page() {
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

      navigate(Paths.companyAdminPath());
      revalidate();
    },
    cancel: () => navigate(Paths.companyAdminPath()),
  });

  return (
    <Pages.Page title={"Rename Company"} testId="company-rename-page">
      <Paper.Root size="small">
        <Paper.NavigateBack to={Paths.companyAdminPath()} title="Back to Company Admin" />

        <Paper.Body>
          <Forms.Form form={form}>
            <div className="mb-6 text-content-accent text-2xl font-extrabold">Editing Company Name</div>

            <Forms.FieldGroup>
              <Forms.TextInput label="Company Name" field={"name"} minLength={2} maxLength={100} />
            </Forms.FieldGroup>

            <Forms.Submit saveText="Save" />
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
