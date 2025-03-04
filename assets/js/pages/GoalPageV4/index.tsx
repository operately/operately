import * as React from "react";
import * as Paper from "@/components/PaperContainer";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";

import { Navigation } from "@/features/goals/GoalPageNavigation";
import { useClearNotificationsOnLoad } from "@/features/notifications";
import { assertPresent } from "@/utils/assertions";

import { Header } from "./Header";
import { Overview } from "./Overview";
import { Targets } from "./Targets";
import { Messages } from "./Messages";
import { RelatedWork } from "./RelatedWork";
import { Timeframe } from "./Timeframe";
import { Champion } from "./Champion";
import { Reviewer } from "./Reviewer";
import { Contributors } from "./Contributors";
import { GoalFeed } from "./GoalFeed";
import { Status } from "./Status";
import { Options } from "./Options";
import { PrimaryButton, SecondaryButton } from "@/components/Buttons";
import { useSearchParams } from "react-router-dom";

interface LoaderResult {
  goal: Goals.Goal;
}

export async function loader({ params, request }): Promise<LoaderResult> {
  return {
    goal: await Goals.getGoal({
      id: params.id,
      includeSpace: true,
      includeTargets: true,
      includeProjects: true,
      includeLastCheckIn: true,
      includePermissions: true,
      includeUnreadNotifications: true,
      includeChampion: true,
      includeReviewer: true,
    }).then((data) => data.goal!),
  };
}

const PageMode = React.createContext<{ mode: "view" | "edit"; setMode: (mode: "view" | "edit") => void }>(null!);

export function usePageMode() {
  return React.useContext(PageMode).mode;
}

export function useSetPageMode() {
  return React.useContext(PageMode).setMode;
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();
  const [searchParams] = useSearchParams();

  assertPresent(goal.notifications, "Goal notifications must be defined");
  useClearNotificationsOnLoad(goal.notifications);

  const [mode, setMode] = React.useState<"view" | "edit">(searchParams.get("mode") === "edit" ? "edit" : "view");

  return (
    <Pages.Page title={[goal.name!]} testId="goal-page">
      <PageMode.Provider value={{ mode, setMode }}>
        <Paper.Root size="large">
          <Navigation space={goal.space!} />

          <Paper.Body minHeight="none">
            <Options goal={goal} />

            <EditBar />

            <div className="flex gap-12">
              <div className="flex-1">
                <Header goal={goal} />
                <Overview />
                <Targets goal={goal} />
                <Messages goal={goal} />
                <RelatedWork />
              </div>

              <div className="w-[260px] text-sm mt-6 sticky top-10">
                <Status goal={goal} />
                <Timeframe goal={goal} />
                <Champion goal={goal} />
                <Reviewer goal={goal} />
                <Contributors goal={goal} />
              </div>
            </div>

            <GoalFeed goal={goal} />
          </Paper.Body>
        </Paper.Root>
      </PageMode.Provider>
    </Pages.Page>
  );
}

function EditBar() {
  const mode = usePageMode();
  const setMode = useSetPageMode();
  const [isSaving, setIsSaving] = React.useState(false);

  if (mode === "view") return null;

  const disableEditMode = () => {
    setMode("view");
    setIsSaving(false);
  };

  const handleDone = () => {
    setMode("view");
    setIsSaving(true);
  };

  return (
    <div className="fixed z-50 top-20 -translate-x-1/2 left-1/2 bg-surface-base px-6 py-4 rounded-full shadow-lg border-2 border-accent-1">
      <div className="flex items-center justify-between gap-10">
        <div className="">Click on the content to edit</div>
        <div className="flex gap-2 items-center">
          <SecondaryButton size="sm" onClick={disableEditMode}>
            Discard Changes
          </SecondaryButton>
          <PrimaryButton size="sm" onClick={handleDone}>
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
