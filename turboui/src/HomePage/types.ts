import type { ReactNode } from "react";
import type { AccessLevels } from "../ApiTypes";
import type { AvatarPerson } from "../Avatar";

export interface HomePageSpace {
  id: string;
  name: string;
  mission?: string | null;
  accessLevels?: AccessLevels | null;
  members?: AvatarPerson[];
  isCompanySpace?: boolean | null;
  link: string;
}

export interface HomePageProps {
  firstName: string;
  spaces: HomePageSpace[];
  canCreateSpace: boolean;
  canInviteMembers: boolean;
  newSpacePath: string;
  invitePeoplePath: string;
  activityFeed: ReactNode;
  now?: Date;
}
