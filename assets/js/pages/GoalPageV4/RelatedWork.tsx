import * as React from "react";
import * as Icons from "@tabler/icons-react";

import AvatarList from "@/components/AvatarList";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { SecondaryButton } from "@/components/Buttons";
import { DisableInEditMode } from "./DisableInEditMode";

export const DimmedLabel = ({ children }) => <div className="text-xs uppercase font-medium mb-1">{children}</div>;

export function RelatedWork() {
  const me = useMe()!;
  const other = { fullName: "John Doe" };

  return (
    <DisableInEditMode>
      <div className="mt-6 pt-6 mb-4 border-t border-stroke-base">
        <div className="mb-4 uppercase text-sm font-bold tracking-wider">Related Work</div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icons.IconTarget size={16} className="text-red-500" /> <div>Expand onto the German market</div>
            <Dots />
            <AvatarList people={[me, other, other, other, other]} size={20} stacked />
            <Progress progress={10} color="bg-red-100" textColor="text-red-700" />
          </div>

          <div className="flex items-center gap-2 ml-6">
            <Icons.IconHexagons size={16} className="text-indigo-500" />{" "}
            <div>
              <s>Germany market research</s>
            </div>
            <Icons.IconCircleCheckFilled size={16} className="text-green-700" />
            <div className="text-sm text-green-700 font-medium">Done</div>
            <Dots />
            <AvatarList people={[me, other, me]} size={20} stacked />
            <Progress progress={100} color="bg-green-100" textColor="text-green-700" />
          </div>

          <div className="flex items-center gap-2 ml-6">
            <Icons.IconHexagons size={16} className="text-indigo-500" /> <div>Open a new office in Germany</div>
            <Dots />
            <AvatarList people={[me]} size={20} stacked />
            <Progress progress={60} color="bg-green-100" textColor="text-green-700" />
          </div>

          <div className="flex items-center gap-2">
            <Icons.IconTarget size={16} className="text-red-500" /> <div>Expand onto the Chinese market</div>
            <Dots />
            <AvatarList people={[me, other]} size={20} stacked />
            <Progress progress={20} color="bg-green-100" textColor="text-green-700" />
          </div>

          <div className="flex items-center gap-1 ml-6">
            <Icons.IconHexagons size={16} className="text-indigo-500" />{" "}
            <div>
              <s>Localize the product for Chinese market</s>
            </div>
            <Icons.IconCircleCheckFilled size={16} className="text-green-700" />
            <div className="text-sm text-green-700 font-medium">Done</div>
            <Dots />
            <AvatarList people={[me, other, me]} size={20} stacked />
            <Progress progress={100} color="bg-green-100" textColor="text-green-700" />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <SecondaryButton size="xs">Add subgoal</SecondaryButton>
            <SecondaryButton size="xs">Start project</SecondaryButton>
          </div>
        </div>
      </div>
    </DisableInEditMode>
  );
}

function Dots() {
  return <div className="border-t-2 border-dotted border-stroke-base flex-1 mx-1" />;
}

function Progress({ progress, color, textColor }) {
  const outerClass = `rounded-lg px-2 py-0.5 shrink-0 ${color}`;
  const innerClass = `text-sm font-medium font-mono ${textColor}`;

  return (
    <div className={outerClass}>
      <div className={innerClass}>{progress}%</div>
    </div>
  );
}
