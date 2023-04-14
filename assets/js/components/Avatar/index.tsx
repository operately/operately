import React from 'react';

export enum AvatarSize {
  Small = 'small',
  Normal = 'normal',
  Large = 'large',
}

export default function Avatar({ person_full_name, size } : { person_full_name : string, size : AvatarSize }) : JSX.Element {
  const initials = person_full_name.split(' ').map((n) => n[0]).join('');

  const sizeClass = size === AvatarSize.Small ? 'w-6 h-6 text-sm' : size === AvatarSize.Large ? 'w-12 h-12 text-2xl' : 'w-10 h-10 text-lg';

  return (
    <div className={"flex items-center justify-center text-white bg-gray-500 rounded-full" + " " + sizeClass}>
      {initials}
    </div>
  );
}

Avatar.defaultProps = {
  size: AvatarSize.Normal,
}
