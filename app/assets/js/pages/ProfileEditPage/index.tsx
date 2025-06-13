import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as React from "react";

import { DeprecatedPaths } from "@/routes/paths";
import { useNavigate } from "react-router-dom";
import { Timezones } from "./timezones";

import Forms from "@/components/Forms";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { PageModule } from "@/routes/types";
import { Avatar } from "turboui";

export default { name: "ProfileEditPage", loader, Page } as PageModule;

interface LoaderResult {
  person: People.Person;
  from: FromLocation;
}

async function loader({ request, params }): Promise<LoaderResult> {
  return {
    person: await People.getPerson({ id: params.id, includeManager: true }).then((d) => d.person!),
    from: Pages.getSearchParam(request, "from") as FromLocation,
  };
}

function Page() {
  const { person } = Pages.useLoadedData() as LoaderResult;

  return (
    <Pages.Page title="Edit Profile">
      <Paper.Root size="small">
        <Navigation />
        <Paper.Body>
          <ProfileForm person={person} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

export type FromLocation = "admin-manage-people" | null;

function Navigation() {
  const { from } = Pages.useLoadedData() as LoaderResult;

  if (from === "admin-manage-people") {
    return (
      <Paper.Navigation
        items={[
          { label: "Company Administration", to: DeprecatedPaths.companyAdminPath() },
          { label: "Manage Team Members", to: DeprecatedPaths.companyManagePeoplePath() },
        ]}
      />
    );
  } else {
    return <Paper.Navigation items={[{ label: "Account", to: DeprecatedPaths.accountPath() }]} />;
  }
}

const ManagerOptions = [
  { value: "no-manager", label: "No manager" },
  { value: "select-from-list", label: "Select manager" },
];

function ProfileForm({ person }: { person: People.Person }) {
  const me = useMe()!;
  const navigate = useNavigate();

  const managerStatus = person.manager ? "select-from-list" : "no-manager";
  const managerLabel = me.id === person.id ? "Who is your manager?" : "Who is their manager?";

  const form = Forms.useForm({
    fields: {
      name: person.fullName,
      title: person.title,
      timezone: person.timezone,
      manager: person.manager?.id,
      managerStatus: managerStatus,
    },
    submit: async () => {
      const managerId = form.values.managerStatus === "select-from-list" ? form.values.manager : null;

      await People.updateProfile({
        id: person.id,
        fullName: form.values.name?.trim(),
        title: form.values.title?.trim(),
        timezone: form.values.timezone,
        managerId: managerId,
      });

      if (me.id === person.id) {
        navigate(DeprecatedPaths.accountPath());
      } else {
        navigate(DeprecatedPaths.companyManagePeoplePath());
      }
    },
  });

  return (
    <Forms.Form form={form}>
      <BigAvatar person={person} />

      <Forms.FieldGroup>
        <Forms.TextInput field={"name"} label="Name" />
        <Forms.TextInput field={"title"} label="Title in Company" />
        <Forms.SelectBox field={"timezone"} label="Timezone" options={Timezones} />

        <Forms.FieldGroup>
          <Forms.RadioButtons field={"managerStatus"} label={managerLabel} options={ManagerOptions} />
          <Forms.SelectPerson
            field={"manager"}
            hidden={form.values.managerStatus !== "select-from-list"}
            default={person.manager}
          />
        </Forms.FieldGroup>
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save Changes" />
    </Forms.Form>
  );
}

function BigAvatar({ person }: { person: People.Person }) {
  return (
    <section className="flex flex-col w-full justify-center items-center text-center my-8">
      <Avatar person={person} size="xxlarge" />
    </section>
  );
}
