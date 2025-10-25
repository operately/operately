import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";

import { useNavigate } from "react-router-dom";
import { Timezones } from "./timezones";

import Forms from "@/components/Forms";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { PageModule } from "@/routes/types";
import BigAvatar from "./BigAvatar";

import { usePaths } from "@/routes/paths";
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
  const paths = usePaths();
  const { from } = Pages.useLoadedData() as LoaderResult;

  if (from === "admin-manage-people") {
    return (
      <Paper.Navigation
        items={[
          { label: "Company Administration", to: paths.companyAdminPath() },
          { label: "Manage Team Members", to: paths.companyManagePeoplePath() },
        ]}
      />
    );
  } else {
    return <Paper.Navigation items={[{ label: "Account", to: paths.accountPath() }]} />;
  }
}

const ManagerOptions = [
  { value: "no-manager", label: "No manager" },
  { value: "select-from-list", label: "Select manager" },
];

function ProfileForm({ person }: { person: People.Person }) {
  const paths = usePaths();
  const me = useMe()!;
  const navigate = useNavigate();
  const managersLoader = People.usePossibleManagersSearch(person.id);

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
        navigate(paths.accountPath());
      } else {
        navigate(paths.companyManagePeoplePath());
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
            searchFn={managersLoader}
          />
        </Forms.FieldGroup>
      </Forms.FieldGroup>

      <Forms.Submit saveText="Save Changes" />
    </Forms.Form>
  );
}
