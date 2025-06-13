import React from "react";

import { DeprecatedPaths } from "@/routes/paths";
import { Avatar, AvatarProps, DivLink } from "turboui";

interface AvatarLinkProps extends AvatarProps {
  className?: string;
}

export function AvatarLink({ className, ...props }: AvatarLinkProps) {
  return (
    <DivLink to={DeprecatedPaths.profilePath(props.person!.id!)} className={className}>
      <Avatar {...props} />
    </DivLink>
  );
}
