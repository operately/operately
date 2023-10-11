import React from "react";

import * as Paper from "@/components/PaperContainer";

import { useProfileMutation } from "@/graphql/Me";

import Avatar from "@/components/Avatar";
import { useMe } from "@/graphql/Me";

import * as Forms from "@/components/Form";

export async function loader(): Promise<null> {
  return null;
}

export function Page() {
  const { data } = useMe();

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
  const [update, { loading }] = useProfileMutation({
    onCompleted: () => {
      window.location.href = "/account";
    },
  });

  const [name, setName] = React.useState(me.fullName);
  const [title, setTitle] = React.useState(me.title);

  const handleSubmit = () => {
    update({
      variables: {
        input: {
          fullName: name,
          title: title,
        },
      },
    });
  };

  const isValid = name.length > 0 && title.length > 0;

  return (
    <Forms.Form onSubmit={handleSubmit} loading={loading} isValid={isValid}>
      <Forms.TextInput value={name} onChange={setName} label="Name" />
      <Forms.TextInput value={title} onChange={setTitle} label="Title in the Company" />

      <Forms.SubmitArea>
        <Forms.SubmitButton>Save Changes</Forms.SubmitButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
