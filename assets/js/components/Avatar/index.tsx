import React from "react";
import classnames from "classnames";

import * as Icons from "@tabler/icons-react";
import { Person } from "@/gql";

export enum AvatarSize {
  Tiny = "tiny",
  Small = "small",
  Normal = "normal",
  Large = "large",
  XLarge = "xlarge",
  XXLarge = "xxlarge",
}

type AvatarSizeString = "tiny" | "small" | "normal" | "large" | "xlarge" | "xxlarge";

interface AvatarProps {
  person: Person | null;
  size: AvatarSize | AvatarSizeString | number;
}

function SizeClasses({ size }: { size: AvatarSize | number }): string {
  if (size.constructor.name === "Number") {
    return "";
  }

  switch (size) {
    case AvatarSize.Tiny:
      return "w-[20px] h-[20px]";
    case AvatarSize.Small:
      return "w-8 h-8";
    case AvatarSize.Normal:
      return "w-8 h-8";
    case AvatarSize.Large:
      return "w-10 h-10";
    case AvatarSize.XLarge:
      return "w-14 h-14";
    case AvatarSize.XXLarge:
      return "w-24 h-24";
  }

  return "";
}

function TextClasses({ size }: { size: AvatarSize | number }): string {
  if (size.constructor.name === "Number") {
    if ((size as number) <= 20) {
      return "text-[10px] font-semibold";
    }

    if ((size as number) <= 24) {
      return "text-[11px] font-bold";
    }
  }

  switch (size) {
    case AvatarSize.Tiny:
      return "text-[9px] font-semibold";
    case AvatarSize.Small:
      return "text font-extrabold";
    case AvatarSize.Normal:
      return "text font-bold";
    case AvatarSize.Large:
      return "text-xl font-bold";
    case AvatarSize.XLarge:
      return "text-2xl font-bold";
    case AvatarSize.XXLarge:
      return "text-5xl font-bold";
  }

  return "";
}

function initials(fullName: string): string {
  try {
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
  } catch (e) {
    console.error(e);
    return "";
  }
}

function BackupAvatar({ person, size }: AvatarProps): JSX.Element {
  const baseClass = classnames(
    "flex items-center justify-center",
    "text-dark-1",
    "bg-pink-300",
    "rounded-full",
    "shrink-0",
  );

  const sizeClass = SizeClasses({ size });
  const textClass = TextClasses({ size });
  const className = baseClass + " " + sizeClass + " " + textClass;

  const style = size.constructor.name === "Number" ? { width: size + "px", height: size + "px" } : {};

  return (
    <div title={person.fullName} className={className} style={style}>
      {initials(person.fullName)}
    </div>
  );
}

//
// Note about "no-referrer":
//
// I noticed an issue with referrer-policy: origin (default) and images from
// googleusercontent.com. Sometimes, not always, the request will be blocked
// with a status 403 code, resulting in rendering the fallback instead of the
// requested image.
//
// Fixed based on this issue: https://github.com/chakra-ui/chakra-ui/issues/5909.
//
function ImageAvatar({ person, size }: AvatarProps): JSX.Element {
  if (!person) return <></>;

  const baseClass = "rounded-full overflow-hidden bg-white shrink-0";
  const sizeClass = SizeClasses({ size });
  const className = baseClass + " " + sizeClass;

  const style = size.constructor.name === "Number" ? { width: size + "px", height: size + "px" } : {};

  return (
    <div title={person.fullName} className={className} style={style}>
      <img src={person.avatarUrl} alt={person.fullName} referrerPolicy="no-referrer" />
    </div>
  );
}

function UnassingedAvatar({ size }: { size: AvatarSize }): JSX.Element {
  const baseClass = "rounded-full overflow-hidden bg-surface-accent flex items-center justify-center shrink-0";
  const sizeClass = SizeClasses({ size });
  const className = baseClass + " " + sizeClass;

  return (
    <div title="Unassigned" className={className}>
      <Icons.IconUser size={size} />
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
