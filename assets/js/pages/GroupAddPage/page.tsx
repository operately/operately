import React from "react";

import { useNavigate } from "react-router-dom";

import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import * as Groups from "@/graphql/Groups";
import { GroupColorChooser } from "@/components/GroupColorChooser";
import { GroupIconChooser } from "@/components/GroupIconChooser";

export function Page() {
  return (
    <Paper.Root size="small">
      <h1 className="mb-4 font-bold text-3xl text-center">Creating a new space</h1>
      <Paper.Body minHeight="none">
        <Form />
      </Paper.Body>
    </Paper.Root>
  );
}

function Form() {
  let navigate = useNavigate();

  const [createGroup, { loading }] = Groups.useCreateGroup();

  const [name, setName] = React.useState("");
  const [mission, setMission] = React.useState("");
  const [icon, setIcon] = React.useState("IconStar");
  const [color, setColor] = React.useState("text-blue-500");

  const onSubmit = async () => {
    const res = await createGroup({
      variables: {
        input: {
          name: name,
          mission: mission,
          icon: icon,
          color: color,
        },
      },
    });

    navigate(`/spaces/${res.data.createGroup.id}`);
  };

  const onCancel = () => navigate("/");

  const isValid = name.length > 0 && mission.length > 0;

  return (
    <Forms.Form isValid={isValid} onSubmit={onSubmit} onCancel={onCancel} loading={loading}>
      <Forms.TextInput label="Space Name" value={name} onChange={setName} placeholder="e.g. Marketing Team" />
      <Forms.TextInput
        label="Purpose"
        value={mission}
        onChange={setMission}
        placeholder="e.g. Create product awareness and bring new leads"
      />

      <div>
        <GroupColorChooser color={color} setColor={setColor} name={name} />
      </div>

      <div>
        <GroupIconChooser icon={icon} setIcon={setIcon} color={color} name={name} />
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton>Create Space</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}
