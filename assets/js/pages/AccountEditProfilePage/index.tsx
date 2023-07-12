import React from "react";

import * as Icons from "@tabler/icons-react";
import * as Paper from "@/components/PaperContainer";

import { logOut, useProfileMutation } from "@/graphql/Me";

import { PuffLoader } from "react-spinners";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { useMe } from "@/graphql/Me";

export function AccountEditProfilePage() {
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    update({
      variables: {
        input: {
          fullName: name,
          title: title,
        },
      },
    });
  };

  const isValid = () => {
    return name.length > 0 && title.length > 0;
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <Input value={name} onChange={setName} label="Name" />
      <Input value={title} onChange={setTitle} label="Title in the Company" />

      <div className="flex gap-2 mt-4">
        <Button submit variant="success" loading={loading} disabled={!isValid()}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="font-bold mb-1 block">{label}</label>

      <div className="flex-1">
        <input
          className="w-full bg-shade-3 text-white-1 placeholder-white-2 border-none rounded-lg px-3"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
