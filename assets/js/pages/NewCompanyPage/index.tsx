import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Api from "@/api";

import { Paths } from "@/routes/paths";
import { Logo } from "@/layouts/DefaultLayout/Logo";
import { useNavigate } from "react-router-dom";

import Forms from "@/components/Forms";

export const loader = Pages.emptyLoader;

export function Page() {
  const navigate = useNavigate();
  const [add] = Api.useAddCompany();

  const form = Forms.useForm({
    fields: { companyName: "", title: "" },
    submit: async () => {
      const res = await add({ ...form.values });
      navigate(Paths.companyHomePath(res.company.id));
    },
  });

  return (
    <Pages.Page title={"New Company"}>
      <Paper.Root size="small" className="mt-24">
        <Paper.NavigateBack to={Paths.lobbyPath()} title="Back to the Lobby" />
        <Paper.Body>
          <PageTitle />

          <Forms.Form form={form}>
            <Forms.FieldGroup>
              <Forms.TextInput field="companyName" label="Name of the company" placeholder="e.g. Acme Co." />
              <Forms.TextInput field="title" label="What's your title in the company?" placeholder="e.g. Founder" />
            </Forms.FieldGroup>

            <Forms.Submit saveText="Create Company" buttonSize="sm" />
          </Forms.Form>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PageTitle() {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="">
        <div className="text-content-accent text-xl font-semibold">New Company</div>
        <div className="text-content-accent">Let&apos;s set up your company in Operately.</div>
      </div>
      <Logo width="40" height="40" />
    </div>
  );
}
