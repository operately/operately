import * as React from "react";

import { Section } from "./Section";
import { SecondaryButton } from "@/components/Buttons";
import classNames from "classnames";
import { BlackLink } from "@/components/Link";
import { Paths } from "@/routes/paths";

export const DimmedLabel = ({ children }) => <div className="text-xs uppercase font-medium mb-1">{children}</div>;

export function Targets() {
  return (
    <Section title="Targets">
      <div className="flex flex-col gap-6">
        <div className="">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <BlackLink
                to={Paths.targetPath("1")}
                className="font-semibold decoration-stone-400 hover:decoration-black hover:text-black"
                underline="hover"
              >
                Figure out how to open a new office in Brazil
              </BlackLink>

              <div className="text-xs text-content-dimmed mt-0.5">
                To be able to conduct business in Brazil, we need to open an office there as per local regulations.
              </div>
            </div>

            <div className="tracking-wide text-sm font-medium">PENDING</div>
          </div>

          <LargeProgress progress={0} color="bg-orange-500" />
        </div>

        <div className="">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <BlackLink
                to={Paths.targetPath("2")}
                className="font-semibold decoration-stone-400 hover:decoration-black hover:text-black"
                underline="hover"
              >
                Eliminate blockers for selling in China
              </BlackLink>

              <div className="text-xs text-content-dimmed mt-0.5">
                We have identified 20 key blockers that are preventing us from selling...
              </div>
            </div>

            <div className="tracking-wider text-sm font-medium">4 / 20</div>
          </div>

          <LargeProgress progress={20} color="bg-orange-500" />
        </div>

        <div className="">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <BlackLink
                to={Paths.targetPath("3")}
                className="font-semibold decoration-stone-400 hover:decoration-black hover:text-black"
                underline="hover"
              >
                Achieve 1000+ active users in new countries
              </BlackLink>
              <div className="text-xs text-content-subtle mt-0.5">No description</div>
            </div>

            <div className="tracking-wider text-sm font-medium">700 / 1000</div>
          </div>

          <LargeProgress progress={70} color="bg-accent-1" />
        </div>

        <div className="">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <BlackLink
                to={Paths.targetPath("3")}
                className="font-semibold decoration-stone-400 hover:decoration-black hover:text-black"
                underline="hover"
              >
                Increase revenue by 20% from international sales
              </BlackLink>
              <div className="text-xs text-content-dimmed mt-0.5">Increase revenue by 20% compared to last quarter</div>
            </div>

            <div className="tracking-wider text-sm font-medium">$ 1.2M / $ 1M</div>
          </div>

          <LargeProgress progress={100} color="bg-accent-1" />
        </div>
      </div>

      <div className="mt-8" />

      <SecondaryButton size="xs">Add target</SecondaryButton>
    </Section>
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
