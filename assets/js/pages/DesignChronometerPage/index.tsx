import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";

import { Chronometer } from "@/components/Chronometer";

export const loader = Pages.emptyLoader;

export function Page() {
  const [[value1, value2, value3, value4], setValues] = React.useState([0, 20, 60, 100]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setValues([Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(today.getDate() - 15);

  return (
    <Pages.Page title="Chronometer">
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo="/">Lobby</Paper.NavItem>
          <Paper.NavSeparator />
          <Paper.NavItem linkTo="/__design__">Design System</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Paper.Header title="Chronometer" />
          <p className="mb-4">
            Used to display the start date, the end date, and the percentage of the total time that has elapsed versus
            the percentage remaining.
          </p>

          <h2 className="font-bold text-lg mt-8 mb-4">Default size</h2>

          <div className="grid grid-cols-2 items-center gap-4">
            <Chronometer start={fifteenDaysAgo} end={thirtyDaysFromNow} />
            <Chronometer progress={20} start={new Date(2024, 11, 26)} end={new Date(2026, 0, 12)} />
            <Chronometer progress={45} start={new Date(2024, 11, 26)} end={new Date(2026, 0, 12)} />
            <Chronometer progress={80} start={fifteenDaysAgo} end={thirtyDaysFromNow} />
          </div>

          <h2 className="font-bold text-lg mt-8 mb-4">Full-width</h2>

          <div className="flex flex-col gap-4">
            <Chronometer width="w-full" start={fifteenDaysAgo} end={thirtyDaysFromNow} />
            <Chronometer width="w-full" progress={20} start={new Date(2024, 11, 26)} end={new Date(2026, 0, 12)} />
            <Chronometer width="w-full" progress={45} start={new Date(2024, 11, 26)} end={new Date(2026, 0, 12)} />
            <Chronometer width="w-full" progress={80} start={fifteenDaysAgo} end={thirtyDaysFromNow} />
          </div>

          <h2 className="font-bold text-lg mt-8 mb-4">Behavior</h2>

          <p className="mb-4">When the progress value changes, the bar animates to the new value.</p>

          <div className="grid grid-cols-2 items-center gap-4">
            <Chronometer progress={value1} start={fifteenDaysAgo} end={thirtyDaysFromNow} />
            <Chronometer progress={value2} start={new Date(2024, 11, 26)} end={new Date(2026, 0, 12)} />
            <Chronometer progress={value3} start={new Date(2024, 11, 26)} end={new Date(2026, 0, 12)} />
            <Chronometer progress={value4} start={fifteenDaysAgo} end={thirtyDaysFromNow} />
          </div>

          <p className="mt-8 mb-4">Values outside of the 0-100 range are clamped.</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
              <Chronometer progress={-20} start={fifteenDaysAgo} end={thirtyDaysFromNow} />
              <div className="font-mono text-xs text-right w-10">-20%</div>
            </div>

            <div className="flex items-center gap-4">
              <Chronometer progress={60} start={fifteenDaysAgo} end={thirtyDaysFromNow} />
              <div className="font-mono text-xs text-right w-10">60%</div>
            </div>

            <div className="flex items-center gap-4">
              <Chronometer progress={120} start={fifteenDaysAgo} end={thirtyDaysFromNow} />
              <div className="font-mono text-xs text-right w-10">120%</div>
            </div>
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
