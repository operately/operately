import * as React from "react";
import * as Pages from "@/components/Pages";
import * as Paper from "@/components/PaperContainer";
import * as Callouts from "@/components/Callouts";

import { DimmedLink, Link } from "@/components/Link";

export const loader = Pages.emptyLoader;

export function Page() {
  return (
    <Pages.Page title={"Tooltips"}>
      <Paper.Root>
        <Paper.Navigation>
          <Paper.NavItem linkTo="/">Lobby</Paper.NavItem>
          <Paper.NavSeparator />
          <Paper.NavItem linkTo="/__design__">Design System</Paper.NavItem>
        </Paper.Navigation>

        <Paper.Body>
          <Paper.Header title="Callouts" />

          <div className="mt-2 mb-10">
            Callouts provide short messages to attract user's immediate attention or action. These widgets are designed
            to be visually prominent and easily noticeable.
          </div>

          <div className="mt-4 mb-4">
            <Callouts.InfoCallout message="This is an info callout" />
          </div>

          <div className="mt-4 mb-4">
            <Callouts.InfoCallout
              message="This is an info callout"
              description="This is the description of the info callout."
            />
          </div>

          <div className="mt-4 mb-4">
            <Callouts.InfoCallout
              message={"Want markup in your info callout?"}
              description={
                <>
                  <Link to={""}>Add a Reviewer</Link> to get feedback and keep things moving smoothly.
                </>
              }
            />
          </div>

          <div className="mt-4 mb-4">
            <Callouts.WarningCallout
              message={
                <span>
                  This is a warning callout <DimmedLink to={""}>with a link</DimmedLink>
                </span>
              }
            />
          </div>

          <div className="mt-4 mb-4">
            <Callouts.WarningCallout
              message="This is a warning callout"
              description="This is the description of the warning callout."
            />
          </div>

          <div className="mt-4 mb-4">
            <Callouts.ErrorCallout message="This is an error alert" />
          </div>

          <div className="mt-4 mb-4">
            <Callouts.ErrorCallout
              message="This is an error alert"
              description={
                <ul role="list" className="list-disc space-y-1 pl-5">
                  <li>Your password must be at least 8 characters</li>
                  <li>Your password must include at least one pro wrestling finishing move</li>
                </ul>
              }
            />
          </div>

          <div className="mt-4 mb-4">
            <Callouts.SuccessCallout message="Successfully uploaded" />
          </div>

          <div className="mt-4 mb-4">
            <Callouts.SuccessCallout
              message="Retrospective submitted"
              description="All project contributors were notified"
            />
          </div>
        </Paper.Body>
      </Paper.Root>
    </Pages.Page>
  );
}
