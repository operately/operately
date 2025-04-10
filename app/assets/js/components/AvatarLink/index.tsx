import React from "react";

import { Avatar, AvatarProps, DivLink } from "turboui";
import { Paths } from "@/routes/paths";

interface AvatarLinkProps extends AvatarProps {
  className?: string;
}

export function AvatarLink({ className, ...props }: AvatarLinkProps) {
  return (
    <DivLink to={Paths.profilePath(props.person!.id!)} className={className}>
      <Avatar {...props} />
    </DivLink>
  );
}
