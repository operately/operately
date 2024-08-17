import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import * as Pages from "@/components/Pages";

import { useNavigate } from "react-router-dom";
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

const ManagerOptions = [
  { value: "no-manager", label: "I don't have a manager" },
  { value: "select-from-list", label: "Select my manager from a list" },
];

function ProfileForm({ me }: { me: People.Person }) {
  const navigate = useNavigate();
  const managerStatus = me.manager ? "select-from-list" : "no-manager";

  const form = Forms.useForm({
    fields: {
      name: Forms.useTextField(me.fullName),
      title: Forms.useTextField(me.title),
      timezone: Forms.useSelectField(me.timezone, Timezones, { optional: true }),
      manager: Forms.useSelectPersonField(me.manager, { optional: true }),
      managerStatus: Forms.useSelectField(managerStatus, ManagerOptions),
    },
    submit: async (form) => {
      await People.updateMyProfile({
        fullName: form.fields.name.value,
        title: form.fields.title.value,
        timezone: form.fields.timezone.value,
        managerId: form.fields.managerStatus.value === "select-from-list" ? form.fields.manager!.value?.id : null,
      });

      navigate(Paths.accountPath());
    },
  });

  return (
    <Forms.Form form={form}>
      <BigAvatar person={me} />

      <Forms.FieldGroup>
        <Forms.TextInput field={"name"} label="Name" />
        <Forms.TextInput field={"title"} label="Title in Company" />
        <Forms.SelectBox field={"timezone"} label="Timezone" />

        <Forms.FieldGroup>
          <Forms.RadioButtons field={"managerStatus"} label="Who is your manager?" />
          <Forms.SelectPerson field={"manager"} hidden={form.fields.managerStatus.value !== "select-from-list"} />
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
