import React from "react";

import { useNavigate } from "react-router-dom";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Forms from "@/components/Form";
import * as Spaces from "@/models/spaces";

import { useLoadedData } from "./loader";

import { Paths } from "@/routes/paths";
import { SpaceColorChooser } from "@/components/SpaceColorChooser";
import { SpaceIconChooser } from "@/components/SpaceIconChooser";

import { SpacePermissionSelector } from "@/features/Permissions";
import { PermissionsProvider, usePermissionsContext } from "@/features/Permissions/PermissionsContext";

export function Page() {
  const { company } = useLoadedData();

  return (
    <Pages.Page title="Create a new space">
      <Paper.Root size="small">
        <h1 className="mb-1 font-bold text-3xl text-center">Create a new space</h1>
        <span className="text-content-dimmed text-center block mb-4">
          Spaces help organize projects, goals, and team members in one place.
        </span>
        <Paper.Body minHeight="none">
          <PermissionsProvider company={company}>
            <Form />
          </PermissionsProvider>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Form() {
  const navigate = useNavigate();
  const { permissions } = usePermissionsContext();

  const [create, { loading }] = Spaces.useCreateGroup();

  const [name, setName] = React.useState("");
  const [mission, setMission] = React.useState("");
  const [icon, setIcon] = React.useState("IconStar");
  const [color, setColor] = React.useState("text-blue-500");

  const [errors, setErrors] = React.useState<[string, string][]>([]);

  const onSubmit = async () => {
    const errors = validate(name, mission);
    setErrors(errors);

    const res = await create({
      name: name,
      mission: mission,
      icon: icon,
      color: color,
      companyPermissions: permissions.company,
      internetPermissions: permissions.internet,
    });

    navigate(Paths.spacePath(res.group.id!));
  };

  const onCancel = () => navigate(Paths.homePath());

  return (
    <Forms.Form isValid={true} onSubmit={onSubmit} onCancel={onCancel} loading={loading}>
      <Forms.TextInput
        label="Space Name"
        value={name}
        onChange={setName}
        placeholder="e.g. Marketing Team"
        error={!!errors.find(([field]) => field === "name")}
      />
      <Forms.TextInput
        label="Purpose"
        value={mission}
        onChange={setMission}
        placeholder="e.g. Create product awareness and bring new leads"
        error={!!errors.find(([field]) => field === "mission")}
      />

      <div>
        <SpaceColorChooser color={color} setColor={setColor} />
      </div>

      <div>
        <SpaceIconChooser icon={icon} setIcon={setIcon} color={color} />
      </div>

      <SpacePermissionSelector />

      <div className="text-content-dimmed text-sm block">
        <span>You can modify these settings later in Space preferences.</span>
      </div>

      <Forms.SubmitArea>
        <Forms.SubmitButton>Create Space</Forms.SubmitButton>
        <Forms.CancelButton>Cancel</Forms.CancelButton>
      </Forms.SubmitArea>
    </Forms.Form>
  );
}

function validate(name: string, mission: string) {
  const errors: [string, string][] = [];

  if (name.length === 0) {
    errors.push(["name", "Name is required"]);
  }

  if (mission.length === 0) {
    errors.push(["mission", "Mission is required"]);
  }

  return errors;
}
