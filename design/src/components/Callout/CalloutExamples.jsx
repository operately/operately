import React from "react";
import * as Callout from "./index";

export function CalloutPageExamples() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-bold text-lg text-content-accent mb-4">
          Types of Callouts
        </h3>
        <p className="text-content-base text-sm mb-4">
          Operately provides four types of callouts for different scenarios:
          info, warning, error, and success.
        </p>
        <div className="p-6 border border-surface-outline rounded-lg bg-surface-base">
          <div className="space-y-4">
            <Callout.InfoCallout message="This is an info callout" />

            <Callout.InfoCallout
              message="This is an info callout"
              description="This is the description of the info callout."
            />

            <Callout.InfoCallout message="Want markup in your info callout?">
              <div>
                Add a Reviewer to get feedback and keep things moving smoothly.
              </div>
            </Callout.InfoCallout>

            <Callout.WarningCallout message="This is a warning callout">
              <a href="#" className="underline hover:text-yellow-800">
                with a link
              </a>
            </Callout.WarningCallout>

            <Callout.WarningCallout
              message="This is a warning callout"
              description="This is the description of the warning callout."
            />

            <Callout.ErrorCallout message="This is an error alert" />

            <Callout.ErrorCallout message="This is an error alert">
              <ul className="list-disc pl-5 space-y-1">
                <li>Your password must be at least 8 characters</li>
                <li>
                  Your password must include at least one pro wrestling
                  finishing move
                </li>
              </ul>
            </Callout.ErrorCallout>

            <Callout.SuccessCallout message="Successfully uploaded" />

            <Callout.SuccessCallout
              message="Retrospective submitted"
              description="All project contributors were notified"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border border-surface-outline rounded-lg bg-surface-base">
          <h3 className="font-bold text-lg text-content-accent">
            When to use callouts
          </h3>
          <ul className="mt-4 list-disc pl-6 text-sm text-content-base space-y-3">
            <li>
              <strong>Information:</strong> Use info callouts to provide neutral
              information or helpful context.
            </li>
            <li>
              <strong>Warnings:</strong> Use warning callouts to alert users
              about potential issues or important considerations.
            </li>
            <li>
              <strong>Errors:</strong> Use error callouts to notify users about
              problems that need immediate attention.
            </li>
            <li>
              <strong>Success:</strong> Use success callouts to confirm that an
              action was completed successfully.
            </li>
          </ul>
        </div>

        <div className="p-6 border border-surface-outline rounded-lg bg-surface-base">
          <h3 className="font-bold text-lg text-content-accent">
            Best practices
          </h3>
          <ul className="mt-4 list-disc pl-6 text-sm text-content-base space-y-3">
            <li>
              <strong>Be concise:</strong> Keep callout messages short and
              clear.
            </li>
            <li>
              <strong>Choose the right type:</strong> Select the appropriate
              callout type based on the nature of the message.
            </li>
            <li>
              <strong>Use sparingly:</strong> Too many callouts can create
              visual noise and reduce their effectiveness.
            </li>
            <li>
              <strong>Position strategically:</strong> Place callouts where they
              will be noticed but not disrupt the flow.
            </li>
          </ul>
        </div>
      </div>

      <div className="p-6 border border-surface-outline rounded-lg bg-surface-base">
        <h3 className="font-bold text-lg text-content-accent">
          Implementation
        </h3>
        <div className="mt-4 text-sm text-content-base">
          <p className="mb-4">
            Import the callout components and use them in your React components:
          </p>
          <pre className="p-4 bg-surface-base rounded border border-surface-outline overflow-x-auto">
            <code>{`import { InfoCallout, WarningCallout, ErrorCallout, SuccessCallout } from "../components/Callout";

// Basic usage
<InfoCallout message="This is an info callout" />

// With description
<WarningCallout 
  message="This is a warning callout" 
  description="This is the description of the warning callout."
/>

// With custom content
<ErrorCallout message="This is an error alert">
  <ul className="list-disc pl-5 space-y-1">
    <li>Your password must be at least 8 characters</li>
    <li>Your password must include at least one pro wrestling finishing move</li>
  </ul>
</ErrorCallout>`}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
