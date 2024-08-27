import * as React from "react";

import { Section, SectionTitle } from "./Section";

import * as Alerts from "@/components/Alerts";
import { DimmedLink, Link } from "@/components/Link";

export function AlertsExamples() {
  return (
    <Section>
      <SectionTitle>Alerts</SectionTitle>

      <div className="max-w-2xl mt-2 mb-10">
        Alerts provide important information or notifications to users. Use them sparingly to convey messages that require immediate attention or action. These widgets are designed to be visually prominent and easily noticeable to ensure that users do not miss important updates or alerts.
      </div>

      <div className="mt-4 mb-4">
        <Alerts.InfoAlert message="This is an info alert" />
      </div>

      <div className="mt-4 mb-4">
        <Alerts.InfoAlert message="This is an info alert" description="This is the description of the info alert." />
      </div>

      <div className="mt-4 mb-4">
        <Alerts.InfoAlert
          message={"Want markup in your info alert?"}
          description={
            <>
              <Link to={""}>Add a Reviewer</Link> to get feedback and keep things moving smoothly.
            </>
          }
        />
      </div>

      <div className="mt-4 mb-4">
        <Alerts.WarningAlert message={<span>This is a warning alert <DimmedLink to={""}>with a link</DimmedLink></span>} />
      </div>

      <div className="mt-4 mb-4">
        <Alerts.WarningAlert
          message="This is a warning alert"
          description="This is the description of the warning alert."
        />
      </div>

      <div className="mt-4 mb-4">
        <Alerts.ErrorAlert message="This is an error alert" />
      </div>

      <div className="mt-4 mb-4">
        <Alerts.ErrorAlert
          message="This is an error alert"
          description={
            <ul role="list" className="list-disc space-y-1 pl-5">
              <li>Your password must be at least 8 characters</li>
              <li>Your password must include at least one pro wrestling finishing move</li>
            </ul>
          }
        />
      </div>
    </Section>
  );
}
