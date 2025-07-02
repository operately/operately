import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Signals from "@/signals";

import { useLoadedData } from "./loader";
import { AssignmentsList } from "./AssignmentsList";
import classNames from "classnames";
import { IconCoffee, IconMailFast, IconSparkles } from "turboui";

export function Page() {
  const onLoad = () => Signals.publish(Signals.LocalSignal.RefreshReviewCount);
  const title = useHtmlTitle();

  return (
    <Pages.Page title={title} onLoad={onLoad}>
      <Paper.Root size="medium">
        <Paper.Body minHeight="600px" noPadding>
          <SendingEmailsBanner />
          <Title />
          <MyWork />
          <ForReview />
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}

function useHtmlTitle() {
  const { assignmentsCount } = useLoadedData();

  const noAssignments = assignmentsCount === 0;
  return noAssignments ? "Review" : `Review (${assignmentsCount})`;
}

function Title() {
  return (
    <div className="my-6">
      <TitleIcon />

      <h1 className="text-2xl font-extrabold text-center mt-2">Review</h1>
      <div className="text-center">Stay on top of your responsibilities</div>
    </div>
  );
}

function TitleIcon() {
  return (
    <div className="flex items-center justify-center">
      <IconCoffee size={24} className="text-content-dimmed" />
    </div>
  );
}

function SendingEmailsBanner() {
  const className = classNames(
    "text-sm font-medium",
    "bg-callout-success-bg text-callout-success-content",
    "px-2 py-1",
    "rounded",
    "border border-callout-success-bg",
    "absolute top-2 right-2",
  );

  return (
    <div className={className}>
      Sending you an email every morning
      <IconMailFast size={20} className="inline-block ml-2" />
    </div>
  );
}

function PageSection({ children }) {
  return (
    <section
      className="px-12 border-t border-stroke-base py-8"
      style={{
        minHeight: "300px",
      }}
    >
      {children}
    </section>
  );
}

function SectionTitle({ title, description }) {
  return (
    <div>
      <div className="text-sm uppercase font-extrabold">{title}</div>
      <div className="text-sm text-content-dimmed">{description}</div>
    </div>
  );
}

function MyWork() {
  const { myWork } = useLoadedData();

  return (
    <PageSection>
      <SectionTitle title="My work" description="Due updates you are responsible for as a champion" />

      {myWork.length === 0 ? <MyWorkEmpty /> : <AssignmentsList assignments={myWork} />}
    </PageSection>
  );
}

function ForReview() {
  const { forReview } = useLoadedData();

  return (
    <PageSection>
      <SectionTitle title="For review" description="Updates from others needing your acknowledgment" />

      {forReview.length === 0 ? <ForReviewEmpty /> : <AssignmentsList assignments={forReview} />}
    </PageSection>
  );
}

function MyWorkEmpty() {
  return (
    <div className="px-4 mt-4 flex items-center justify-center py-20 gap-2">
      <IconSparkles size={20} className="text-yellow-500" />
      All caught up!
    </div>
  );
}

function ForReviewEmpty() {
  return (
    <div className="px-4 mt-4 flex items-center justify-center py-28 gap-2">
      <IconSparkles size={20} className="text-yellow-500" />
      Nothing to review.
    </div>
  );
}
