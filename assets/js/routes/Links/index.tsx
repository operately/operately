import React from "react";
import { Link } from "react-router-dom";

interface MilestoneLinkProps extends React.ComponentPropsWithoutRef<"a"> {
  projectID: string;
  milestoneID: string;
}

export function MilestoneLink({ projectID, milestoneID, ...props }: MilestoneLinkProps): JSX.Element {
  const { className, ...rest } = props;

  return (
    <Link
      data-test-id={`milestone-link-${milestoneID}`}
      className={`underline ${className}`}
      to={`/projects/${projectID}/milestones/${milestoneID}`}
      {...rest}
    />
  );
}
