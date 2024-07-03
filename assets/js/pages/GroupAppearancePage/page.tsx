import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Spaces from "@/models/spaces";

import { Link } from "@/components/Link";
import { useLoadedData } from "./loader";
import { GhostButton } from "@/components/Button";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { SpaceColorChooser } from "@/components/SpaceColorChooser";
import { SpaceIconChooser } from "@/components/SpaceIconChooser";
import { Paths } from "@/routes/paths";

export function Page() {
  const { space } = useLoadedData();

  const [color, setColor] = React.useState(space.color);
  const [icon, setIcon] = React.useState(space.icon);

  return (
    <Pages.Page title={["Appearance Settings", space.name!]}>
      <Paper.Root size="small">
        <div className="flex items-center justify-center mb-2">
          <Link to={Paths.spacePath(space.id!)}>
            <Icons.IconArrowLeft className="text-content-dimmed inline mr-2" size={16} />
            Back to the {space.name} Space
          </Link>
        </div>

        <Paper.Body minHeight="none">
          <div className="font-extrabold text-2xl text-center">Appearance of {space.name}</div>

          <div className="h-px bg-stroke-base my-8"></div>
          <SpaceColorChooser color={color!} name={space.name!} setColor={setColor} />

          <div className="h-px bg-stroke-base my-8"></div>
          <SpaceIconChooser icon={icon!} name={space.name!} setIcon={setIcon} color={color!} />

          <div className="h-px bg-stroke-base my-8"></div>

          <SubmitButton color={color} icon={icon} space={space} />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function SubmitButton({ space, color, icon }) {
  const goToSpace = useNavigateTo(Paths.spacePath(space.id));
  const [update] = Spaces.useUpdateSpaceAppearanceMutation({ onCompleted: goToSpace });

  const save = React.useCallback(() => {
    update({
      variables: {
        input: {
          id: space.id,
          color,
          icon,
        },
      },
    });
  }, [update, space.id, color, icon]);

  return (
    <div className="flex items-center justify-center mt-8">
      <GhostButton onClick={save} testId="save">
        Save Changes
      </GhostButton>
    </div>
  );
}
