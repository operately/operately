export type AvatarSizeString = "tiny" | "small" | "normal" | "large" | "xlarge" | "xxlarge";

export type AvatarSize = AvatarSizeString | number;

export interface AvatarPerson {
  id?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface AvatarProps {
  person: AvatarPerson;
  size: AvatarSize;
  className?: string;
  testId?: string;
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

export type NameFormat = "first" | "short" | "full";
