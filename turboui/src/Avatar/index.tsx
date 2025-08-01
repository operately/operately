import React from "react";
import classNames from "../utils/classnames";
import { AvatarProps, AvatarSize } from "./types";

export { AvatarList } from "./AvatarList";
export { AvatarWithName } from "./AvatarWithName";
export type { AvatarPerson, AvatarProps } from "./types";

function calculateSize(size: AvatarSize): number {
  if (size.constructor.name === "Number") {
    return size as number;
  }

  switch (size) {
    case "tiny":
      return 20;
    case "small":
      return 32;
    case "normal":
      return 32;
    case "large":
      return 40;
    case "xlarge":
      return 56;
    case "xxlarge":
      return 96;
  }

  throw new Error("Invalid size");
}

function TextClasses({ size }: { size: AvatarSize }): string {
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

    return "text-3xl font-bold";
  }

  switch (size) {
    case "tiny":
      return "text-[7px] font-semibold";
    case "small":
      return "text-[9px] font-extrabold";
    case "normal":
      return "text-base font-bold";
    case "large":
      return "text-sm font-bold";
    case "xlarge":
      return "text-xl font-bold";
    case "xxlarge":
      return "text-3xl font-bold";
  }

  return "";
}

function initials(fullName?: string | null): string {
  try {
    if (!fullName) return "";

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

function BackupAvatar({ person, size, className }: AvatarProps): JSX.Element {
  const around = classNames("rounded-full overflow-hidden shrink-0 border border-stroke-base inline-block", className);
  const baseClass = "text-white-1 bg-gray-500 h-full rounded-full shrink-0 tracking-wider font-semibold";

  const inner = baseClass + " " + TextClasses({ size });

  const sizeNumber = calculateSize(size);
  const style = { width: `${sizeNumber}px`, height: `${sizeNumber}px` };

  return (
    <div title={person.fullName ?? ""} className={around} style={style}>
      <div className={inner}>
        <div className="flex items-center justify-center h-full">{initials(person.fullName)}</div>
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
function ImageAvatar({ person, size, className }: AvatarProps): JSX.Element {
  if (!person) return <></>;

  const cn = classNames(
    "rounded-full overflow-hidden bg-white shrink-0 border border-stroke-base inline-block",
    className,
  );

  const sizeNumber = calculateSize(size);
  const style = { width: `${sizeNumber}px`, height: `${sizeNumber}px` };

  return (
    <div title={person.fullName ?? ""} className={cn} style={style}>
      <img
        src={person.avatarUrl!}
        alt={person.fullName ?? ""}
        referrerPolicy="no-referrer"
        style={{
          height: "100%",
          width: "100%",
          display: "block",
          maxHeight: size + "px",
        }}
      />
    </div>
  );
}

export function Avatar(props: AvatarProps) {
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
