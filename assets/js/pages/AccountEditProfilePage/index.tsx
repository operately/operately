import React from "react";
import * as Paper from "@/components/PaperContainer";
import * as People from "@/models/people";
import { useProfileMutation } from "@/graphql/Me";
import Avatar from "@/components/Avatar";
import { useMe } from "@/models/people";
import * as Forms from "@/components/Form";
import { useNavigateTo } from "@/routes/useNavigateTo";
import PeopleSearch from "@/components/PeopleSearch";

export async function loader() {
  return null;
}

export function Page() {
  const { data } = useMe({ includeManager: true });

  if (!data) {
    return null;
  }

  const me = data.me;

  return (
    <Paper.Root size="small">
      <Paper.Navigation>
        <Paper.NavItem linkTo="/account">
          <Avatar person={me} size="tiny" />
          Account
        </Paper.NavItem>
      </Paper.Navigation>

      <Paper.Body minHeight="300px">
        <h1 className="text-2xl font-bold">Edit your profile information</h1>

        <div className="mt-8 flex flex-col gap-8">
          <ProfileForm me={me} />
        </div>
      </Paper.Body>
    </Paper.Root>
  );
}

function ProfileForm({ me }) {
  const navigateToAccount = useNavigateTo("/account");
  const [update, { loading }] = useProfileMutation({
    onCompleted: navigateToAccount,
  });

  const [name, setName] = React.useState(me.fullName);
  const [title, setTitle] = React.useState(me.title);
  const [manager, setManager] = React.useState(me.manager);
  const [managerStatus, setManagerStatus] = React.useState(me.manager ? "select-from-list" : "no-manager");

  const [timezone, setTimezone] = React.useState(() => {
    if (me.timezone) {
      return { value: me.timezone, label: me.timezone };
    } else {
      return null;
    }
  });

  const timezones = Intl.supportedValuesOf("timeZone");

  const handleSubmit = () => {
    update({
      variables: {
        input: {
          fullName: name,
          title: title,
          timezone: timezone?.value,
          managerId: managerStatus === "select-from-list" ? manager?.id : null,
        },
      },
    });
  };

  const isValid = name.length > 0 && title.length > 0;

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid}>
      <Forms.TextInput value={name} onChange={setName} label="Name" error={name.length === 0} />
      <Forms.TextInput value={title} onChange={setTitle} label="Title in the Company" error={title.length === 0} />

      <Forms.SelectBox
        label="Timezone"
        placeholder="Select your timezone..."
        value={timezone}
        defaultValue={timezone}
        onChange={(option) => setTimezone(option)}
        options={timezones.map((tz) => ({
          value: tz,
          label: tz.replace(/_/g, " "),
        }))}
        data-test-id="timezone-selector"
      />

      <ManagerSearch
        manager={manager}
        setManager={setManager}
        managerStatus={managerStatus}
        setManagerStatus={setManagerStatus}
      />

      <Forms.SubmitArea>
        <Forms.SubmitButton>Save Changes</Forms.SubmitButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}

function ManagerSearch({ manager, setManager, managerStatus, setManagerStatus }) {
  const loader = People.usePeopleSearch();

  return (
    <div>
      <label className="font-semibold block mb-1">Who is your manager?</label>
      <div className="flex-1">
        <Forms.RadioGroup name="manager-status" defaultValue={managerStatus} onChange={setManagerStatus}>
          <Forms.Radio value="no-manager" label="I don't have a manager" />
          <Forms.Radio value="select-from-list" label="Select my manager from a list" />
        </Forms.RadioGroup>

        {managerStatus === "select-from-list" && (
          <div className="mt-2">
            <PeopleSearch
              onChange={(option) => setManager(option?.person)}
              defaultValue={manager}
              placeholder="Search for person..."
              inputId="manager-search"
              loader={loader}
            />
          </div>
        )}
      </div>
    </div>
  );
}
