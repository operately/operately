import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as People from "@/graphql/People";

import { useProfileMutation } from "@/graphql/Me";

import Avatar from "@/components/Avatar";
import { useMe } from "@/graphql/Me";

import * as Forms from "@/components/Form";
import { useNavigateTo } from "@/routes/useNavigateTo";
import PeopleSearch from "@/components/PeopleSearch";

export async function loader(): Promise<null> {
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
  const goToAccount = useNavigateTo("/account");

  const [update, { loading }] = useProfileMutation({
    onCompleted: goToAccount,
  });

  const [name, setName] = React.useState(me.fullName);
  const [title, setTitle] = React.useState(me.title);
  const [manager, setManager] = React.useState(me.manager);
  const [managerStatus, setManagerStatus] = React.useState(me.manager ? "select-from-list" : "no-manager");

  const handleSubmit = () => {
    update({
      variables: {
        input: {
          fullName: name,
          title: title,
          managerId: managerStatus === "select-from-list" ? manager?.id : null,
        },
      },
    });
  };

  const isValid = name.length > 0 && title.length > 0;

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid}>
      <Forms.TextInput value={name} onChange={setName} label="Name" />
      <Forms.TextInput value={title} onChange={setTitle} label="Title in the Company" />

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

        {managerStatus !== "select-from-list" ? null : (
          <div className="mt-2">
            <PeopleSearch
              onChange={(option) => setManager(option?.person)}
              defaultValue={manager}
              placeholder="Search for person..."
              inputId={"manager-search"}
              loader={loader}
            />
          </div>
        )}
      </div>
    </div>
  );
}
