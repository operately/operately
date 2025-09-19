import React from "react";
import { BlackLink } from "../Link";
import { Avatar } from ".";
import { AvatarProps, AvatarSizeString, NameFormat } from "./types";
import classNames from "../utils/classnames";

interface Props extends AvatarProps {
  nameFormat?: NameFormat;
  className?: string;
  link?: string;
  title?: string;
  textSize?: AvatarSizeString;
  showAvatar?: boolean;
}

export function AvatarWithName({
  person,
  size,
  className,
  nameFormat = "full",
  link,
  title,
  textSize,
  showAvatar = true,
}: Props) {
  const name = formattedName(person.fullName!, nameFormat);
  const textClassName = classNames(resolveTextSize(size, textSize), className);

  return (
    <div className={classNames("flex items-center", showAvatar ? "gap-1.5" : "gap-0")}>
      {showAvatar && <Avatar person={person} size={size} />}
      <div className="flex flex-col">
        {link ? (
          <BlackLink to={link} className={textClassName} underline="hover">
            {name}
          </BlackLink>
        ) : (
          <div className={textClassName}>{name}</div>
        )}
        {title && <div className="text-xs text-content-dimmed">{title}</div>}
      </div>
    </div>
  );
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0]!;
}

export function shortName(fullName: string): string {
  const length = fullName.split(" ").length;

  if (length < 2) return firstName(fullName);
  return firstName(fullName) + " " + lastNameInitial(fullName) + ".";
}

export function formattedName(fullName: string, nameFormat: NameFormat): string {
  if (nameFormat === "first") {
    return firstName(fullName);
  }

  if (nameFormat === "short") {
    return shortName(fullName);
  }

  return fullName;
}

function lastNameInitial(fullName: string): string {
  return fullName!.split(" ").slice(-1)[0]![0]!;
}

function resolveTextSize(size: Props["size"], textSize?: Props["textSize"]) {
  switch (textSize) {
    case "tiny":
      return "text-xs";
    case "small":
      return "text-sm";
    case "normal":
      return "text-base";
    case "large":
      return "text-lg";
    case "xlarge":
      return "text-xl";
    case "xxlarge":
      return "text-2xl";
  }

  switch (size) {
    case "tiny":
      return "text-xs";
    case "small":
      return "text-sm";
    default:
      return "text-base";
  }
}
