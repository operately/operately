import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Pages from "@/components/Pages";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useGetMe } from "@/models/people";
import { Paths } from "@/routes/paths";

import Avatar from "@/components/Avatar";
import Forms from "./Forms";

export async function loader() {
  return null;
}

export function Page() {
  const { data } = useGetMe({ includeManager: true });
  if (!data || !data.me) return null;

  return (
    <Pages.Page title="Edit Profile">
      <Paper.Root size="small">
        <Navigation />
        <Paper.Body minHeight="300px">
          <ProfileForm me={data.me} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Navigation() {
  return (
    <Paper.Navigation>
      <Paper.NavItem linkTo={Paths.accountPath()}>Account</Paper.NavItem>
    </Paper.Navigation>
  );
}

function ProfileForm({ me }: { me: People.Person }) {
  const navigateToAccount = useNavigateTo(Paths.accountPath());
  const timezones = [
    { value: "America/New_York", label: "America/New_York" },
    { value: "America/Chicago", label: "America/Chicago" },
    { value: "America/Denver", label: "America/Denver" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles" },
    { value: "America/Anchorage", label: "America/Anchorage" },
    { value: "Pacific/Honolulu", label: "Pacific/Honolulu" },
  ];

  const managerStatus = me.manager ? "select-from-list" : "no-manager";
  const managerOptions = [
    { value: "no-manager", label: "I don't have a manager" },
    { value: "select-from-list", label: "Select from list" },
  ];

  const form = Forms.useForm({
    fields: {
      name: Forms.useTextField(me.fullName),
      title: Forms.useTextField(me.title),
      timezone: Forms.useSelectField(me.timezone, timezones, { optional: true }),
      manager: Forms.useSelectPersonField(me.manager),
      managerStatus: Forms.useSelectField(managerStatus, managerOptions),
    },
    submit: async (form) => {
      await People.updateMyProfile({
        fullName: form.fields.name.value,
        title: form.fields.title.value,
        timezone: form.fields.timezone.value,
        managerId: form.fields.managerStatus.value === "select-from-list" ? form.fields.manager.value?.id : null,
      });

      navigateToAccount();
    },
  });

  return (
    <Forms.Form form={form}>
      <BigAvatar person={me} />

      <Forms.FieldGroup>
        <Forms.TextInput field={"name"} label="Name" />
        <Forms.TextInput field={"title"} label="Title in Company" />
        <Forms.SelectBox field={"timezone"} label="Timezone" />
        <Forms.SelectBox field={"managerStatus"} label="Manager" />
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
