import * as React from "react";

import { Section } from "./Section";
import { SecondaryButton } from "@/components/Buttons";
import classNames from "classnames";
import { BlackLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

export const DimmedLabel = ({ children }) => <div className="text-xs uppercase font-medium mb-1">{children}</div>;

export function Targets() {
  return (
    <div className="">
      <div className="mt-8 mb-4 uppercase text-sm font-bold tracking-wider">Targets</div>

      <div className="grid grid-cols-1 gap-4">
        <Target name="Figure out how to open a new office in Brazil" value={0} total={0} progress={0} />
        <Target name="Eliminate blockers for selling in China" value={4} total={20} progress={20} />
        <Target name="Achieve 1000+ active users in new countries" value={700} total={1000} progress={70} />
        <Target
          name="Increase revenue by 20% from international sales"
          value={"$ 1.2M"}
          total={"$ 1M"}
          progress={100}
        />
      </div>

      <div className="mt-6" />
      <SecondaryButton size="xs">Add target</SecondaryButton>
    </div>
  );
}

function Target({ name, value, total, progress }) {
  return (
    <div className="">
      <div className="flex items-start justify-between">
        <div className="font-medium">
          <BlackLink
            to={Paths.targetPath("3")}
            className="font-medium decoration-stone-400 hover:decoration-black hover:text-black"
            underline="hover"
          >
            {name}
          </BlackLink>
        </div>
        <div className="tracking-wider text-sm font-medium">
          {value} / {total}
        </div>
      </div>

      <LargeProgress progress={progress} color="bg-accent-1" />
    </div>
  );
}

function LargeProgress({ progress, color }) {
  const outer = classNames("h-1.5 bg-stroke-base mt-2");
  const inner = classNames("h-1.5", color);

  return (
    <div className={outer}>
      <div className={inner} style={{ width: progress + "%" }} />
    </div>
  );
}
