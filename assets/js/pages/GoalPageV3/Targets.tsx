import * as React from "react";

import { Section } from "./Section";
import { SecondaryButton } from "@/components/Buttons";
import { IconChartPie, IconTarget } from "@tabler/icons-react";

export const DimmedLabel = ({ children }) => <div className="text-xs uppercase font-medium mb-1">{children}</div>;

export function Targets() {
  return (
    <Section title="Targets" icon={<IconTarget size={14} />}>
      <div className="flex flex-col">
        <div className="pb-4 border-stroke-base ">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <span className="font-semibold">Figure out how to open a new office in Brazil</span>
              <div className="text-xs text-content-dimmed mt-0.5">
                To be able to conduct business in Brazil, we need to open an office there as per local regulations.
              </div>
            </div>

            <div className="tracking-wide text-sm font-medium">PENDING</div>
          </div>

          <div className="h-2 bg-stroke-base mt-3" />
        </div>

        <div className=" py-4 border-stroke-base ">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <span className="font-semibold">Eliminate blockers for selling in China</span>
              <div className="text-xs text-content-dimmed mt-0.5">
                We have identified 20 key blockers that are preventing us from selling...
              </div>
            </div>

            <div className="tracking-wider text-sm font-medium">4 / 20</div>
          </div>

          <div className="h-2 bg-stroke-base mt-3">
            <div className="h-2 bg-orange-500" style={{ width: "20%" }} />
          </div>
        </div>

        <div className="py-4 border-stroke-base ">
          <div className="flex items-start justify-between">
            <div className="font-medium">
              <span className="font-semibold">Achieve 1000+ active users in new countries</span>
              <div className="text-xs text-content-subtle mt-0.5">No description</div>
            </div>

            <div className="tracking-wider text-sm font-medium">700 / 1000</div>
          </div>

          <div className="h-2 bg-stroke-base mt-3">
            <div className="h-2 bg-accent-1" style={{ width: "70%" }} />
          </div>
        </div>
      </div>

      <div className="mt-4" />

      <SecondaryButton size="xs">Add target</SecondaryButton>
    </Section>
  );
}
