import { BlackLink } from "../Link";
import { Avatar } from ".";
import { AvatarWithNameProps, NameFormat } from "./types";
import classNames from "../utils/classnames";

export function AvatarWithName({ person, size, className, nameFormat = "full", link }: AvatarWithNameProps) {
  const name = formattedName(person.fullName!, nameFormat);
  const textClassName = classNames(textSize(size), className);

  return (
    <div className="flex items-center gap-1.5">
      <Avatar person={person} size={size} />
      {link ? (
        <BlackLink to={link} className={textClassName} underline="hover">
          {name}
        </BlackLink>
      ) : (
        <div className={textClassName}>{name}</div>
      )}
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

function textSize(size: AvatarWithNameProps["size"]) {
  switch (size) {
    case "tiny":
      return "text-xs";
    case "small":
      return "text-sm";
    default:
      return "text-base";
  }
}
