import React from "react";

import { usePaths } from "@/routes/paths";
import { Avatar, AvatarProps, DivLink } from "turboui";

interface AvatarLinkProps extends AvatarProps {
  className?: string;
}

export function AvatarLink({ className, ...props }: AvatarLinkProps) {
  const paths = usePaths();
  return (
    <DivLink to={paths.profilePath(props.person!.id!)} className={className}>
      <Avatar {...props} />
    </DivLink>
  );
}
