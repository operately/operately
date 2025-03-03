import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { ProgressBar } from "@/components/charts";

export const loader = Pages.emptyLoader;

export function Page() {
  const [[value1, value2, value3, value4], setValues] = React.useState([0, 20, 60, 100]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setValues([Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Pages.Page title={"Progress"}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo="/">Lobby</Paper.NavItem>
          <Paper.NavSeparator />
          <Paper.NavItem linkTo="/__design__">Design System</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Paper.Header title="Progress Bars" />

          <h2 className="font-bold text-lg mt-8">Small Progress Bars</h2>
          <p className="mb-4">Used for showing progress in small spaces, like cards or tables.</p>

          <div className="flex items-center gap-4">
            <ProgressBar percentage={0} width="w-[50px]" height="h-[9px]" />
            <ProgressBar percentage={20} width="w-[50px]" height="h-[9px]" />
            <ProgressBar percentage={60} width="w-[50px]" height="h-[9px]" />
            <ProgressBar percentage={100} width="w-[50px]" height="h-[9px]" />
          </div>

          <h2 className="font-bold text-lg mt-8">Full-width Progress Bars</h2>
          <p className="mb-4">Used for goal targets</p>

          <div className="flex flex-col gap-4">
            <ProgressBar
              percentage={0}
              width="w-full"
              height="h-1.5"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />
            <ProgressBar
              percentage={20}
              width="w-full"
              height="h-1.5"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />
            <ProgressBar
              percentage={60}
              width="w-full"
              height="h-1.5"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />
            <ProgressBar
              percentage={100}
              width="w-full"
              height="h-1.5"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />
          </div>

          <h2 className="font-bold text-lg mt-8 mb-4">Behavior</h2>

          <p className="mb-4">When the progress bar value changes, the bar animates to the new value.</p>

          <div className="flex flex-col gap-4">
            <ProgressBar
              percentage={value1}
              width="w-full"
              height="h-1.5"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />
            <ProgressBar
              percentage={value2}
              width="w-full"
              height="h-1.5"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />
            <ProgressBar
              percentage={value3}
              width="w-full"
              height="h-1.5"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />
            <ProgressBar
              percentage={value4}
              width="w-full"
              height="h-1.5"
              rounded={false}
              bgColor="var(--color-stroke-base)"
            />
          </div>

          <p className="mt-8 mb-4">Values outside of the 0-100 range are clamped.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <ProgressBar
                percentage={-20}
                width="w-96"
                height="h-1.5"
                rounded={false}
                bgColor="var(--color-stroke-base)"
              />

              <div className="font-mono text-xs text-right w-10">-20%</div>
            </div>

            <div className="flex items-center gap-4">
              <ProgressBar
                percentage={60}
                width="w-96"
                height="h-1.5"
                rounded={false}
                bgColor="var(--color-stroke-base)"
              />
              <div className="font-mono text-xs text-right w-10">60%</div>
            </div>

            <div className="flex items-center gap-4">
              <ProgressBar
                percentage={120}
                width="w-96"
                height="h-1.5"
                rounded={false}
                bgColor="var(--color-stroke-base)"
              />
              <div className="font-mono text-xs text-right w-10">120%</div>
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
