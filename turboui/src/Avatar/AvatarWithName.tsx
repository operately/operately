import { Avatar } from ".";
import { AvatarWithNameProps, NameFormat } from "./types";

export function AvatarWithName({ person, size, className, nameFormat = "full" }: AvatarWithNameProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Avatar person={person} size={size} />
      <div className={className}>{formattedName(person.fullName!, nameFormat)}</div>
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
