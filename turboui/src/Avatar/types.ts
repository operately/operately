type AvatarSizeString =
  | "tiny"
  | "small"
  | "normal"
  | "large"
  | "xlarge"
  | "xxlarge";

export type AvatarSize = AvatarSizeString | number;

export interface AvatarPerson {
  id?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface AvatarProps {
  person: AvatarPerson;
  size: AvatarSize;
}

export interface AvatarLinkProps extends AvatarProps {
  to: string;
  className?: string;
}

export interface AvatarListProps {
  people: AvatarPerson[];
  size: AvatarSize;

  stacked?: boolean;
  maxElements?: number;

  showCutOff?: boolean;
  wrap?: boolean;
  stackSpacing?: string;
}

export interface AvatarWithNameProps extends AvatarProps {
  nameFormat?: NameFormat;
  className?: string;
}

export type NameFormat = "first" | "short" | "full";
