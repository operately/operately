import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Companies from "@/models/companies";

import { useNavigate } from "react-router-dom";
import { Paths } from "@/routes/paths";
import { CopyToClipboard } from "@/components/CopyToClipboard";
import { PrimaryButton } from "turboui";
import { PageModule } from "@/routes/types";

import Forms from "@/components/Forms";
import { match } from "ts-pattern";

export default { name: "CompanyAdminAddPeoplePage", loader, Page } as PageModule;

interface LoaderResult {
  company: Companies.Company;
}

async function loader({ params }): Promise<LoaderResult> {
  return {
    company: await Companies.getCompany({ id: params.companyId }).then((d) => d.company!),
  };
}

type PageState = PageStateForm | PageStateInvited | PageStateAdded;
type PageStateForm = { state: "form" };
type PageStateInvited = { state: "invited"; url: string; fullName: string };
type PageStateAdded = { state: "added"; fullName: string };
type SetPageStateFn = (state: PageState) => void;

//
// The page can be in two states: "form" or "invited".
// When in "form" state, the user can fill out the form to invite a new member.
// When in "invited" state, the user is shown the invitation link to share with the new member.
//
function Page() {
  const { company } = Pages.useLoadedData<LoaderResult>();
  const [state, setState] = React.useState<PageState>({ state: "form" });

  return (
    <Pages.Page title={["Invite new Member", company.name!]}>
      {match(state.state)
        .with("form", () => <InviteForm setPageState={setState} />)
        .with("invited", () => <InvitedPage state={state as PageStateInvited} setPageState={setState} />)
        .with("added", () => <AddedPage state={state as PageStateAdded} setPageState={setState} />)
        .exhaustive()}
    </Pages.Page>
  );
}

function InviteForm({ setPageState }: { setPageState: SetPageStateFn }) {
  const navigate = useNavigate();

  const [add] = Companies.useAddCompanyMember();
  const form = Forms.useForm({
    fields: {
      fullName: "",
      email: "",
      title: "",
    },
    validate: (addError) => {
      if (!form.values.email.includes("@")) addError("email", "Email must include '@'");
    },
    submit: async () => {
      const res = await add({
        fullName: form.values.fullName.trim(),
        email: form.values.email.trim(),
        title: form.values.title.trim(),
      });

      if (res.newAccount) {
        const url = Companies.createInvitationUrl(res.invitation!.token!);
        setPageState({ state: "invited", url, fullName: form.values.fullName });
      } else {
        setPageState({ state: "added", fullName: form.values.fullName });
      }
    },
    onError: (e) => {
      const { data } = (e.response as any) ?? {};

      if ("message" in data && typeof data.message === "string") {
        if (data.message.toLowerCase().includes("email")) {
          form.actions.addErrors({ email: data.message });
        }
        if (data.message.toLowerCase().includes("name")) {
          form.actions.addErrors({ fullName: data.message });
        }
      }
    },
    cancel: () => {
      navigate(Paths.companyManagePeoplePath());
    },
  });

  return (
    <Paper.Root size="small">
      <Navigation />
      <Paper.Body minHeight="none">
        <div className="text-content-accent text-2xl font-extrabold mb-8">Invite a new Member</div>

        <Forms.Form form={form}>
          <Forms.FieldGroup layout="horizontal">
            <Forms.TextInput field={"fullName"} label="Full Name" placeholder="e.g. John Doe" minLength={3} />
            <Forms.TextInput field={"email"} label="Email" placeholder="e.g. john@yourcompany.com" minLength={3} />
            <Forms.TextInput field={"title"} label="Title" placeholder="e.g. Software Engineer" />
          </Forms.FieldGroup>
          <Forms.Submit saveText="Invite Member" />
        </Forms.Form>
      </Paper.Body>

      <div className="my-8 text-center px-20">
        <span className="font-bold">What happens next?</span> If the new member already has an account, they will be
        added to your company. If they don't have an account, you will get a invitation link to share with them. The
        link will be valid for 24 hours.
      </div>
    </Paper.Root>
  );
}

function InvitedPage({ state, setPageState }: { state: PageStateInvited; setPageState: SetPageStateFn }) {
  const inviteAnother = () => setPageState({ state: "form" });

  return (
    <Paper.Root size="medium">
      <Navigation />
      <Paper.Body minHeight="none">
        <div className="text-content-accent text-2xl font-extrabold">{state.fullName} has been invited 🎉</div>

        <div className="mt-4">
          Share this link with them to allow them to join your company.
          <div className="mt-4 font-bold text-content-accent mb-1">Invitation Link</div>
          <div className="text-content-primary border border-surface-outline rounded-lg px-3 py-1 font-medium flex items-center justify-between">
            {state.url}

            <CopyToClipboard text={state.url} size={25} padding={1} containerClass="" />
          </div>
        </div>

        <div className="mt-2">This link will expire in 24 hours.</div>
      </Paper.Body>

      <div className="flex items-center gap-3 mt-8 justify-center">
        <PrimaryButton onClick={inviteAnother} testId="invite-another-button">
          Invite Another Member
        </PrimaryButton>
      </div>
    </Paper.Root>
  );
}

function AddedPage({ state, setPageState }: { state: PageStateAdded; setPageState: SetPageStateFn }) {
  const inviteAnother = () => setPageState({ state: "form" });

  return (
    <Paper.Root size="medium">
      <Navigation />
      <Paper.Body minHeight="none">
        <div className="text-content-accent text-2xl font-extrabold">{state.fullName} has been added 🎉</div>
      </Paper.Body>

      <div className="flex items-center gap-3 mt-8 justify-center">
        <PrimaryButton onClick={inviteAnother} testId="invite-another-button">
          Invite Another Member
        </PrimaryButton>
      </div>
    </Paper.Root>
  );
}

function Navigation() {
  return (
    <Paper.Navigation
      items={[
        { to: Paths.companyAdminPath(), label: "Company Administration" },
        { to: Paths.companyManagePeoplePath(), label: "Manage People" },
      ]}
    />
  );
}
