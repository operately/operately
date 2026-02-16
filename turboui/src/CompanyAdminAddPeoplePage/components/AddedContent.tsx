import React from "react";
import { ResourceAccessContent, ResourceAccessContentProps } from "./ResourceAccessContent";

interface Props extends ResourceAccessContentProps {
  fullName: string;
  isGuest: boolean;
}

export function AddedContent(props: Props) {
  return (
    <div>
      <div className="text-content-accent text-xl sm:text-2xl font-extrabold">{props.fullName} has been added</div>

      <div className="mt-4">
        {props.fullName} has been added to the company and an email has been sent to notify them.
      </div>

      {props.isGuest && <ResourceAccessContent {...props} />}
    </div>
  );
}
