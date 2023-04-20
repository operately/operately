import React from 'react';

export enum AvatarSize {
  Small = 'small',
  Normal = 'normal',
  Large = 'large',
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

function SizeClasses({size} : {size: AvatarSize}) : string {
  switch (size) {
    case AvatarSize.Small:
      return 'w-7 h-7';
    case AvatarSize.Large:
      return 'w-12 h-12';
    case AvatarSize.Normal:
      return 'w-10 h-10';
  }
}

function TextClasses({size} : {size: AvatarSize}) : string {
  switch (size) {
    case AvatarSize.Small:
      return 'text-xs font-semibold';
    case AvatarSize.Large:
      return 'text-2xl font-bold';
    case AvatarSize.Normal:
      return 'text-lg font-bold';
  }
}

function BackupAvatar({person, size} : AvatarProps) : JSX.Element {
  const initials = person.fullName.split(' ').map((n) => n[0]).join('');

  const baseClass = "flex items-center justify-center text-white rounded-full bg-brand-base";
  const sizeClass = SizeClasses({size});
  const textClass = TextClasses({size});
  const className = baseClass + " " + sizeClass + " " + textClass;

  return (
    <div className={className}>
      {initials}
    </div>
  );
}

function ImageAvatar({person, size} : AvatarProps) : JSX.Element {
  const baseClass = "rounded-full overflow-hidden bg-brand-base";
  const sizeClass = SizeClasses({size});
  const className = baseClass + " " + sizeClass;

  return (
    <div className={className}>
      <img src={person.avatarUrl} alt={person.fullName} />
    </div>
  );
}

export default function Avatar(props : AvatarProps) : JSX.Element {
  return props.person.avatarUrl ? ImageAvatar(props) : BackupAvatar(props);
}

Avatar.defaultProps = {
  size: AvatarSize.Normal,
}
