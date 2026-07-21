import React from "react";
import { BlackLink } from "../Link";
import { firstName } from "../utils/people";
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
  /** Render as inline-flex so the name can sit in a paragraph with surrounding text. */
  inline?: boolean;
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
  inline = false,
}: Props) {
  const name = formattedName(person.fullName!, nameFormat);
  const textClassName = classNames(resolveTextSize(size, textSize), className);
  const NameWrapper = inline && !title ? "span" : "div";

  return (
    <div
      className={classNames(
        inline ? "inline-flex" : "flex",
        "items-center",
        showAvatar ? "gap-1.5" : "gap-0",
        inline && "whitespace-nowrap align-middle",
      )}
    >
      {showAvatar && <Avatar person={person} size={size} />}
      <NameWrapper className={inline && !title ? undefined : "flex flex-col"}>
        {link ? (
          <BlackLink to={link} className={textClassName} underline="hover">
            {name}
          </BlackLink>
        ) : (
          <NameWrapper className={textClassName}>{name}</NameWrapper>
        )}
        {title && <div className="text-xs text-content-dimmed">{title}</div>}
      </NameWrapper>
    </div>
  );
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
