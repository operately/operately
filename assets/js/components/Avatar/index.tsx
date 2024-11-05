import * as React from "react";
import * as People from "@/models/people";

import classnames from "classnames";

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
  person: People.Person | null;
  size: AvatarSize | AvatarSizeString | number;
}

function calculateSize(size: AvatarSize | AvatarSizeString | number): number {
  if (size.constructor.name === "Number") {
    return size as number;
  }

  switch (size) {
    case AvatarSize.Tiny:
      return 20;
    case AvatarSize.Small:
      return 32;
    case AvatarSize.Normal:
      return 32;
    case AvatarSize.Large:
      return 40;
    case AvatarSize.XLarge:
      return 56;
    case AvatarSize.XXLarge:
      return 96;
  }

  throw new Error("Invalid size");
}

function TextClasses({ size }: { size: AvatarSizeString | number }): string {
  if (size.constructor.name === "Number") {
    if ((size as number) <= 18) {
      return "text-[8px] font-semibold";
    }

    if ((size as number) <= 20) {
      return "text-[8px] font-semibold";
    }

    if ((size as number) <= 24) {
      return "text-[11px] font-bold";
    }

    if ((size as number) <= 40) {
      return "text-base font-bold";
    }

    if ((size as number) <= 60) {
      return "text-lg font-bold";
    }

    throw new Error("Invalid size " + size);
  }

  switch (size) {
    case AvatarSize.Tiny:
      return "text-[9px] font-semibold";
    case AvatarSize.Small:
      return "text-[9px] font-extrabold";
    case AvatarSize.Normal:
      return "text-base font-bold";
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
      return firstLeters[0]!;
    } else {
      return firstLeters[0]! + firstLeters[firstLeters.length - 1]!;
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

function BackupAvatar({ person, size }: AvatarProps): JSX.Element {
  const around = "rounded-full overflow-hidden shrink-0 border border-stroke-base inline-block";

  const baseClass = classnames(
    "text-white-1",
    "bg-gray-500",
    "h-full",
    "rounded-full",
    "shrink-0",
    "tracking-wider",
    "font-semibold",
  );

  const className = baseClass + " " + TextClasses({ size });

  const sizeNumber = calculateSize(size);
  const style = { width: `${sizeNumber}px`, height: `${sizeNumber}px` };

  return (
    <div title={person!.fullName!} className={around} style={style}>
      <div className={className}>
        <div className="flex items-center justify-center h-full">{initials(person!.fullName!)}</div>
      </div>
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

  const className = "rounded-full overflow-hidden bg-white shrink-0 border border-stroke-base inline-block";

  const sizeNumber = calculateSize(size);
  const style = { width: `${sizeNumber}px`, height: `${sizeNumber}px` };

  return (
    <div title={person.fullName!} className={className} style={style}>
      <img
        src={person.avatarUrl!}
        alt={person.fullName!}
        referrerPolicy="no-referrer"
        style={{ height: "100%", width: "100%", display: "block", maxHeight: size + "px" }}
      />
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
    return BackupAvatar({ person: { fullName: "?" }, size: props.size });
  }
}
