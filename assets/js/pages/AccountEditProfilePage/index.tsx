import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Pages from "@/components/Pages";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { useGetMe } from "@/models/people";
import { Paths } from "@/routes/paths";
import { Timezones } from "./timezones";

import Avatar from "@/components/Avatar";
import Forms from "@/components/Forms";

export const loader = Pages.emptyLoader;

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

  const managerStatus = me.manager ? "select-from-list" : "no-manager";
  const managerOptions = [
    { value: "no-manager", label: "I don't have a manager" },
    { value: "select-from-list", label: "Select from list" },
  ];

  const form = Forms.useForm({
    fields: {
      name: Forms.useTextField(me.fullName),
      title: Forms.useTextField(me.title),
      timezone: Forms.useSelectField(me.timezone, Timezones, { optional: true }),
      manager: Forms.useSelectPersonField(me.manager, { optional: true }),
      managerStatus: Forms.useSelectField(managerStatus, managerOptions),
    },
    submit: async (form) => {
      await People.updateMyProfile({
        fullName: form.fields.name.value,
        title: form.fields.title.value,
        timezone: form.fields.timezone.value,
        managerId: form.fields.managerStatus.value === "select-from-list" ? form.fields.manager!.value?.id : null,
      });

      navigateToAccount();
    },
  });

  return (
    <Forms.Form form={form}>
      <BigAvatar person={me} />

      <Forms.FieldGroup>
        <Forms.TextInput field={"name"} label="Name" />
        <Forms.TextInput field={"title"} label="Title" />
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
