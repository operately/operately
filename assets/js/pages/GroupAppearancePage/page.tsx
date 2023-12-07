import React from "react";

import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Icons from "@tabler/icons-react";
import * as Groups from "@/graphql/Groups";

import { Link } from "@/components/Link";
import { useLoadedData } from "./loader";
import { GhostButton } from "@/components/Button";
import { useNavigateTo } from "@/routes/useNavigateTo";

import classnames from "classnames";
import { GroupColorChooser } from "@/components/GroupColorChooser";

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

          <GroupColorChooser color={color} group={group} setColor={setColor} />

          <div className="h-px bg-stroke-base my-8"></div>

          <h2 className="font-bold">Icon</h2>
          <p className="text-sm text-content-dimmed">Choose an icon for the {group.name} Space.</p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <IconOption setIcon={setIcon} color={color} icon="IconStar" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconRocket" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconMicrophone" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconSpeakerphone" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconBook" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconVocabulary" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconFriends" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconBallBasketball" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconBat" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconBolt" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconBox" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconReportMoney" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconPlanet" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconTrash" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconFlower" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconServerBolt" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconHeartHandshake" current={icon} />
            <IconOption setIcon={setIcon} color={color} icon="IconLifebuoy" current={icon} />
          </div>

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

const fgtobg = {
  "text-blue-500": "bg-blue-500",
  "text-green-500": "bg-green-500",
  "text-red-500": "bg-red-500",
  "text-yellow-500": "bg-yellow-500",
  "text-purple-500": "bg-purple-500",
  "text-pink-500": "bg-pink-500",
};

const fgtoborder = {
  "text-blue-500": "border-blue-500",
  "text-green-500": "border-green-500",
  "text-red-500": "border-red-500",
  "text-yellow-500": "border-yellow-500",
  "text-purple-500": "border-purple-500",
  "text-pink-500": "border-pink-500",
};

function IconOption({ color, icon, current, setIcon }) {
  const Icon = Icons[icon];

  const className = classnames("w-16 h-16 rounded flex items-center justify-center border-2 relative cursor-pointer", {
    "border-surface-outline": icon !== current,
    "bg-surface-dimmed": icon !== current,
    "text-content-subtle": icon !== current,
    [fgtoborder[color]]: icon === current,
    [color]: icon === current,
  });

  return (
    <div className={className} onClick={() => setIcon(icon)}>
      {React.createElement(Icon)}
    </div>
  );
}
