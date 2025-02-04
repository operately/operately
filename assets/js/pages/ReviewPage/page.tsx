import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Signals from "@/signals";
import * as Icons from "@tabler/icons-react";

import { useLoadedData } from "./loader";
import { AssignmentsList, Escalation } from "./AssignmentsList";
import classNames from "classnames";

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
          <Escalations />
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
      <Icons.IconCoffee size={24} className="text-content-dimmed" />
    </div>
  );
}

function SendingEmailsBanner() {
  const className = classNames(
    "text-sm font-medium",
    "bg-callout-success text-callout-success-message",
    "px-2 py-1",
    "rounded",
    "border border-callout-success",
    "absolute top-2 right-2",
  );

  return (
    <div className={className}>
      Sending you an email every morning
      <Icons.IconMailFast size={20} className="inline-block ml-2" />
    </div>
  );
}

function PageSection({ children }) {
  return <section className="px-16 border-t border-stroke-base py-8">{children}</section>;
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
      <SectionTitle title="For review" description="Updates from others needing your help or acknowledgment" />

      {forReview.length === 0 ? <ForReviewEmpty /> : <AssignmentsList assignments={forReview} />}
    </PageSection>
  );
}

function MyWorkEmpty() {
  return (
    <div className="flex items-center justify-center gap-2 mb-6 mt-12">
      <Icons.IconSparkles size={20} className="text-yellow-500" />
      All caught up!
    </div>
  );
}

function ForReviewEmpty() {
  return (
    <div className="flex items-center justify-center gap-2 mb-6 mt-12">
      <Icons.IconSparkles size={20} className="text-yellow-500" />
      Nothing to review.
    </div>
  );
}

function Escalations() {
  return (
    <PageSection>
      <SectionTitle title="Escalated to me" description="Updates and acknowlegements neglected by your reports" />

      <div className="flex flex-col mt-8">
        <div className="text-xs uppercase font-extrabold text-content-error mb-1 tracking-wide">2 days overdue</div>

        <Escalation
          title="Ensure financial stability"
          type="Missed Goal Update"
          champion="John Doe"
          escalations={[{ fullName: "You", when: "today" }]}
        />

        <div className="text-xs uppercase font-extrabold text-content-error mb-1 tracking-wide mt-6">
          10 days overdue
        </div>

        <Escalation
          title="Document core business processes in company playbook"
          type="Missed Goal Update"
          champion="Jane Doe"
          escalations={[
            { fullName: "John Doe", when: "7 days ago" },
            { fullName: "You", when: "today" },
          ]}
        />

        <Escalation
          title="Improve product"
          type="Missed Goal Update"
          champion="Jane Doe"
          escalations={[
            { fullName: "John Doe", when: "7 days ago" },
            { fullName: "You", when: "today" },
          ]}
        />

        <div className="text-xs uppercase font-extrabold text-content-error mb-1 tracking-wide mt-6">
          2 weeks overdue
        </div>

        <Escalation
          title="Launch new product"
          type="Missed Goal Update"
          champion="Tina Doe"
          escalations={[
            { fullName: "John Doe", when: "10 days ago" },
            { fullName: "Sally Smith", when: "5 days ago" },
            { fullName: "You", when: "today" },
          ]}
        />

        <Escalation
          title="Solve world hunger"
          type="Missed Goal Update"
          champion="Jane Doe"
          escalations={[
            { fullName: "John Doe", when: "10 days ago" },
            { fullName: "Sally Smith", when: "5 days ago" },
            { fullName: "You", when: "today" },
          ]}
        />
      </div>
    </PageSection>
  );
}
