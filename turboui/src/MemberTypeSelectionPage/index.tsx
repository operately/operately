import React from "react";

import { DivLink } from "../Link";
import type { Navigation } from "../Page/Navigation";
import { Navigation as PageNavigation } from "../Page/Navigation";
import { useHtmlTitle } from "../Page/useHtmlTitle";

export namespace MemberTypeSelectionPage {
  export interface Props {
    companyName?: string;
    navigationItems?: Navigation.Item[];
    teamMemberPath: string;
    outsideCollaboratorPath: string;
    testId?: string;
  }
}

export function MemberTypeSelectionPage(props: MemberTypeSelectionPage.Props) {
  const pageTitle = props.companyName ? ["Invite people", props.companyName] : "Invite people";
  useHtmlTitle(pageTitle);

  return (
    <div className="mx-auto relative sm:my-10 max-w-2xl" data-test-id={props.testId}>
      {props.navigationItems && <PageNavigation items={props.navigationItems} />}
      <div className="relative bg-surface-base min-h-dvh sm:min-h-0 sm:border sm:border-surface-outline sm:rounded-lg sm:shadow-xl">
        <div className="px-4 sm:px-10 py-8">
          <div className="text-content-accent text-2xl font-extrabold mb-6">Who are you inviting?</div>

          <div className="flex flex-col gap-4">
            <MemberTypeCard
              title="Team member"
              description="This person is part of the company. They are added to the general space and can see all non-secret projects, goals, and spaces."
              to={props.teamMemberPath}
              testId="select-team-member"
            />
            <MemberTypeCard
              title="Outside collaborator"
              description="This person is not a company member. They get access only to specific spaces, goals, or projects that are shared with them."
              to={props.outsideCollaboratorPath}
              testId="select-outside-collaborator"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberTypeCard({
  title,
  description,
  to,
  testId,
}: {
  title: string;
  description: string;
  to: string;
  testId: string;
}) {
  return (
    <DivLink
      to={to}
      className="block border border-surface-outline rounded-lg px-5 py-4 text-left hover:bg-surface-dimmed transition-colors"
      testId={testId}
    >
      <div className="font-bold text-content-accent">{title}</div>
      <div className="text-sm text-content-dimmed mt-1">{description}</div>
    </DivLink>
  );
}
