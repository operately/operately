import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Paper from "@/components/PaperContainer";
import * as Timeframes from "@/utils/timeframes";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";

import { GoalSubpageNavigation } from "@/features/goals/GoalSubpageNavigation";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { FilledButton } from "@/components/Button";

interface LoaderResult {
  goal: Goals.Goal;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    me: await People.getMe({}),
    goal: await Goals.getGoal({ id: params.goalId }),
  };
}

export function Page() {
  const { goal } = Pages.useLoadedData<LoaderResult>();

  const [timeframe, setTimeframe] = React.useState<Timeframes.Timeframe>(Timeframes.parse(goal.timeframe));

  const peopleSearch = People.usePeopleSearch();
  const editor = TipTapEditor.useEditor({
    peopleSearch: peopleSearch,
    placeholder: "Write a comment to explain the change...",
  });

  return (
    <Pages.Page title={["Edit Timeframe", goal.name]}>
      <Paper.Root size="small">
        <GoalSubpageNavigation goal={goal} />

        <Paper.Body minHeight="300px">
          <div className="text-content-accent text-2xl font-extrabold">Editing the Goal's Timeframe</div>
          <div className="w-64 mb-8">
            <div className="text-content-accent">Current timeframe: {Timeframes.format(timeframe)}</div>
          </div>

          <div>
            <p className="font-bold mb-1">Select new timeframe</p>
            <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} />
          </div>

          <div className="mt-8">
            <p className="font-bold mb-1">
              Comment <span className="text-content-dimmed font-normal">(optional)</span>
            </p>
            <Editor editor={editor.editor} />
          </div>

          <div className="mt-8 font-medium">
            <p className="font-bold">When you submit:</p>
            <PeopleList goal={goal} me={me} />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function PeopleList({ goal, me }: { goal: Goals.Goal; me: People.Person }) {
  const people = [goal.champion!, goal.reviewer!].filter((person) => person.id !== me.id);

  return (
    <div className="flex flex-wrap gap-4">
      {people.map((person) => (
      ))}
    </div>
  );
}

function Editor({ editor }: { editor: TipTapEditor.Editor }) {
  return (
    <div className="border border-surface-outline rounded-lg overflow-hidden">
      <TipTapEditor.Root editor={editor}>
        <TipTapEditor.Toolbar editor={editor} noTopBorder />

        <div className="text-content-accent relative border-b border-stroke-base p-2" style={{ minHeight: "160px" }}>
          <TipTapEditor.EditorContent editor={editor} />
        </div>
      </TipTapEditor.Root>
    </div>
  );
}
