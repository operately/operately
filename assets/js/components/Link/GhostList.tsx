import * as React from "react";
import { DivLink } from "@/components/Link";
import classNames from "classnames";

export interface GhostLinkProps {
  to: string;
  text: string;
  testID?: string;
  dimmed?: boolean;
  size?: "base" | "sm" | "xs";
  className?: string;
}

export function GhostLink(props: GhostLinkProps) {
  const classname = classNames(
    "font-medium",
    "hover:underline",
    {
      "text-content-dimmed": props.dimmed,
      "text-sm": props.size === "sm",
      "text-xs": props.size === "xs",
    },
    props.className,
  );

  return <DivLink to={props.to} className={classname} testId={props.testID} children={props.text} />;
}
