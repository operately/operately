import React from "react";
import Icon from "../../components/Icon";

export enum AvatarSize {
  Tiny = "tiny",
  Small = "small",
  Normal = "normal",
  Large = "large",
  XLarge = "xlarge",
  XXLarge = "xxlarge",
}

interface Person {
  avatarUrl?: string;
  fullName: string;
  title?: string;
  id: string;
}

interface AvatarProps {
  person: Person;
  size: AvatarSize;
}

function SizeClasses({ size }: { size: AvatarSize }): string {
  switch (size) {
    case AvatarSize.Tiny:
      return "w-[24px] h-[24px]";
    case AvatarSize.Small:
      return "w-[30px] h-[30px]";
    case AvatarSize.Normal:
      return "w-10 h-10";
    case AvatarSize.Large:
      return "w-12 h-12";
    case AvatarSize.XLarge:
      return "w-14 h-14";
    case AvatarSize.XXLarge:
      return "w-24 h-24";
  }
}

function TextClasses({ size }: { size: AvatarSize }): string {
  switch (size) {
    case AvatarSize.Tiny:
      return "text-[10px] font-semibold";
    case AvatarSize.Small:
      return "text-xs font-semibold";
    case AvatarSize.Normal:
      return "text-lg font-bold";
    case AvatarSize.Large:
      return "text-2xl font-bold";
    case AvatarSize.XLarge:
      return "text-2xl font-bold";
    case AvatarSize.XXLarge:
      return "text-5xl font-bold";
  }
}

function initials(fullName: string): string {
  const firstLeters = fullName
    .split(" ")
    .filter((e) => e !== "")
    .map((n) => n[0]);

  if (firstLeters.length === 0) {
    return "";
  } else if (firstLeters.length === 1) {
    return firstLeters[0];
  } else {
    return firstLeters[0] + firstLeters[firstLeters.length - 1];
  }
}

function BackupAvatar({ person, size }: AvatarProps): JSX.Element {
  const baseClass =
    "flex items-center justify-center text-white rounded-full bg-brand-base";
  const sizeClass = SizeClasses({ size });
  const textClass = TextClasses({ size });
  const className = baseClass + " " + sizeClass + " " + textClass;

  return (
    <div title={person.fullName} className={className}>
      {initials(person.fullName)}
    </div>
  );
}

function ImageAvatar({ person, size }: AvatarProps): JSX.Element {
  const baseClass = "rounded-full overflow-hidden bg-white";
  const sizeClass = SizeClasses({ size });
  const className = baseClass + " " + sizeClass;

  return (
    <div title={person.fullName} className={className}>
      <img src={person.avatarUrl} alt={person.fullName} />
    </div>
  );
}

function UnassingedAvatar({ size }: { size: AvatarSize }): JSX.Element {
  return (
    <div title="Unassigned" className="-ml-0.5">
      <Icon name="user" color="dark-2" />
    </div>
  );
}

export default function Avatar(props: AvatarProps): JSX.Element {
  if (props.person) {
    if (props.person.avatarUrl) {
      return ImageAvatar(props);
    } else {
      return BackupAvatar(props);
    }
  } else {
    return UnassingedAvatar(props);
  }
}

Avatar.defaultProps = {
  size: AvatarSize.Normal,
};
