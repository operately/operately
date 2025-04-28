import * as Icons from "@tabler/icons-react";
import { match } from "ts-pattern";
import { Tooltip } from "../Tooltip";

interface Props {
  privacyLevel: "public" | "internal" | "confidential" | "secret";
  resourceType: "goal";
  spaceName: string;

  iconSize?: number;
  className?: string;
}

const DEFAULT_SIZE = 24;

export function PrivacyIndicator(props: Props) {
  props = { ...props, iconSize: props.iconSize ?? DEFAULT_SIZE };

  if (props.privacyLevel === "internal") {
    return null;
  }

  const tooltipContent = (
    <div>
      <div className="text-content-accent font-bold">{title(props)}</div>
      <div className="text-content-dimmed mt-1 w-64 text-sm">{description(props)}</div>
    </div>
  );

  const icon = match(props.privacyLevel)
    .with("public", () => <Icons.IconWorld size={props.iconSize!} />)
    .with("confidential", () => <Icons.IconLockFilled size={props.iconSize!} />)
    .with("secret", () => <Icons.IconLockFilled size={props.iconSize!} className="text-content-error" />)
    .exhaustive();

  return (
    <Tooltip content={tooltipContent} delayDuration={100} contentClassName={props.className}>
      {icon}
    </Tooltip>
  );
}

function title(props: Props) {
  if (props.privacyLevel === "internal") return null;

  return match(props.privacyLevel)
    .with("public", () => "Anyone on the internet")
    .with("confidential", () => `Only ${props.spaceName} members`)
    .with("secret", () => `Invite-Only`)
    .exhaustive();
}

function description(props: Props) {
  if (props.privacyLevel === "internal") return null;

  const t = props.resourceType;
  const s = props.spaceName;

  return match(props.privacyLevel)
    .with("public", () => `This ${t} is visible to anyone on the internet who has the link.`)
    .with("confidential", () => `This ${t} is visible only to members of the ${s} space.`)
    .with("secret", () => `Only people explicitly invited to this ${t} can view it.`)
    .exhaustive();
}
