import React, { useMemo } from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Signals from "@/signals";

import { useLoadedData } from "./loader";
import { AssignmentsHeader, AssignmentsList } from "./AssignmentsList";

export function Page() {
  const { assignmentsCount } = useLoadedData();

  const onLoad = () => Signals.publish(Signals.LocalSignal.RefreshReviewCount);
  const noAssignments = assignmentsCount === 0;
  const title = noAssignments ? "Review" : `Review (${assignmentsCount})`;

  return (
    <Pages.Page title={title} onLoad={onLoad}>
      <Paper.Root size="large">
        <Paper.Body minHeight="600px">
          <Title />

          {noAssignments ? <ZeroAssignments /> : <AllAssignments />}
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function Title() {
  return <div className="text-content-dimmed text-lg">Review</div>;
}

function ZeroAssignments() {
  return (
    <div className="text-center mt-12">
      <span className="text-2xl">🎉</span>
      <div className="mt-2 text-lg">You're all caught up!</div>
    </div>
  );
}

function AllAssignments() {
  const { assignments } = useLoadedData();

  const myWork = useMemo(() => assignments.filter((a) => a.type === "project" || a.type === "goal"), [assignments]);

  const toReview = useMemo(
    () => assignments.filter((a) => a.type === "check_in" || a.type === "goal_update"),
    [assignments],
  );

  return (
    <div className="flex flex-col space-y-8 mt-6">
      {myWork.length > 0 && (
        <section>
          <AssignmentsHeader
            title={`My work (${myWork.length})`}
            description="Due updates you are responsible for as a champion"
          />
          <AssignmentsList assignments={myWork} />
        </section>
      )}

      {toReview.length > 0 && (
        <section>
          <AssignmentsHeader
            title={`To review (${toReview.length})`}
            description="Updates from others needing your acknowledgment"
          />
          <AssignmentsList assignments={toReview} />
        </section>
      )}
    </div>
  );
}
