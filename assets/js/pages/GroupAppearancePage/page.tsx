import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Groups from "@/graphql/Groups";

import { Link } from "@/components/Link";
import { useLoadedData } from "./loader";
import { GhostButton } from "@/components/Button";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { GroupColorChooser } from "@/components/GroupColorChooser";
import { GroupIconChooser } from "@/components/GroupIconChooser";

export function Page() {
  const { group } = useLoadedData();

  const [color, setColor] = React.useState(group.color);
  const [icon, setIcon] = React.useState(group.icon);

  return (
    <Pages.Page title={["Appearance Settings", group.name]}>
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-2">
          <Link to={`/spaces/${group.id}`}>
            <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
            Back to the {group.name} Space
          </Link>
        </div>

        <Paper.Body minHeight="none">
          <div className="font-extrabold text-2xl text-center">Appearance of {group.name}</div>

          <div className="h-px bg-stroke-base my-8"></div>
          <GroupColorChooser color={color} name={group.name} setColor={setColor} />

          <div className="h-px bg-stroke-base my-8"></div>
          <GroupIconChooser icon={icon} name={group.name} setIcon={setIcon} color={color} />

          <div className="h-px bg-stroke-base my-8"></div>

          <SubmitButton color={color} icon={icon} group={group} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ group, color, icon }) {
  const goToSpace = useNavigateTo("/spaces/" + group.id);
  const [update] = Groups.useUpdateGroupAppearanceMutation({ onCompleted: goToSpace });

  const save = React.useCallback(() => {
    update({
      variables: {
        input: {
          id: group.id,
          color,
          icon,
        },
      },
    });
  }, [update, group.id, color, icon]);

  return (
    <div className="flex items-center justify-center mt-8">
      <GhostButton onClick={save} testId="save">
        Save Appearance changes
      </GhostButton>
    </div>
  );
}
