import React from "react";

import classnames from "classnames";

import * as Icons from "@tabler/icons-react";

interface GroupIconChooserProps {
  name: string;
  icon: string;
  setIcon: (icon: string) => void;
  color: string;
}

export function GroupIconChooser({ name, color, icon, setIcon }: GroupIconChooserProps) {
  return (
    <>
      <h2 className="font-bold">Icon</h2>
      <p className="text-sm text-content-dimmed">Choose an icon for the {name} Space.</p>

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
    </>
  );
}

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
