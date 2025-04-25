import { DivLink } from "../Link";
import { Avatar } from ".";
import { AvatarWithNameProps, NameFormat } from "./types";

export function AvatarWithName({ person, size, className, nameFormat = "full", link }: AvatarWithNameProps) {
  const name = formattedName(person.fullName!, nameFormat);

  return (
    <div className="flex items-center gap-1.5">
      <Avatar person={person} size={size} />
      {link ? (
        <DivLink to={link} className={className}>
          {name}
        </DivLink>
      ) : (
        <div className={className}>{name}</div>
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
