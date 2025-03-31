import React from "react";
import { Tooltip } from "./index";
import { IconWorld, IconLock, IconLockOpen } from "./icons";

/**
 * Example of a tooltip showing "Anyone on the internet" status
 * @returns {JSX.Element} Tooltip example component
 */
export function TooltipExamplePublic() {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Anyone on the internet</div>
      <div className="text-content-dimmed mt-1 w-64">This project is visible to anyone on the internet.</div>
    </div>
  );

  return (
    <Tooltip content={content} delayDuration={100}>
      <div className="p-2 border border-surface-outline rounded-md cursor-help flex items-center gap-2">
        <IconWorld className="text-content-accent" />
        <span>Public Project</span>
      </div>
    </Tooltip>
  );
}

/**
 * Example of a tooltip showing "Confidential" status
 * @returns {JSX.Element} Tooltip example component
 */
export function TooltipExampleConfidential() {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Confidential</div>
      <div className="text-content-dimmed mt-1 w-64">
        Only people who are part of the HR team can view this project.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} delayDuration={100}>
      <div className="p-2 border border-surface-outline rounded-md cursor-help flex items-center gap-2">
        <IconLock className="text-content-accent" />
        <span>Confidential Project</span>
      </div>
    </Tooltip>
  );
}

/**
 * Example of a tooltip showing "Invite-only" status
 * @returns {JSX.Element} Tooltip example component
 */
export function TooltipExampleInviteOnly() {
  const content = (
    <div>
      <div className="text-content-accent font-bold">Invite-only</div>
      <div className="text-content-dimmed mt-1 w-64">Only people who are added to this project can view it.</div>
    </div>
  );

  return (
    <Tooltip content={content} delayDuration={100}>
      <div className="p-2 border border-surface-outline rounded-md cursor-help flex items-center gap-2">
        <IconLock className="text-danger" />
        <span>Invite-only Project</span>
      </div>
    </Tooltip>
  );
}

/**
 * Example showcasing tooltip with different triggers
 * @returns {JSX.Element} Tooltip example component
 */
export function TooltipExampleTriggers() {
  return (
    <div className="flex gap-4">
      <Tooltip content="Simple text tooltip" delayDuration={100}>
        <button className="p-2 bg-surface-dimmed rounded-md cursor-help">
          Hover me
        </button>
      </Tooltip>
      
      <Tooltip 
        content={
          <div className="flex flex-col gap-1">
            <div className="font-bold">Rich content tooltip</div>
            <div className="text-content-dimmed">With multiple lines of text</div>
          </div>
        } 
        delayDuration={100}
      >
        <button className="p-2 bg-primary text-white-1 rounded-md cursor-help">
          Rich tooltip
        </button>
      </Tooltip>
    </div>
  );
}

/**
 * Example showing various tooltip positions
 * @returns {JSX.Element} Tooltip example component
 */
export function TooltipExamplePositions() {
  // Not implemented yet - requires adding positioning props to the Tooltip component
  return (
    <div className="flex gap-4">
      <div className="p-2 bg-surface-dimmed text-content-dimmed rounded-md cursor-not-allowed">
        Coming soon
      </div>
    </div>
  );
}
