import React from 'react';

import Avatar, {AvatarSize} from '../../components/Avatar';
import Icon from '../../components/Icon';

export default function User() {
  return (
    <div className="fixed top-2 right-2 p-[18px] flex gap-10 items-center justify-between bg-light-2 rounded-lg w-[300px]">
      <div className="flex gap-2 items-center">
        <Avatar size={AvatarSize.Small} person_full_name="Igor Sarcevic" />
        <span className="font-semibold">Igor Sarcevic</span>
      </div>

      <div className="hover:cursor-pointer flex items-center gap-2">
        <Icon name="settings" color="dark-2" hoverColor="dark" />
        <Icon name="chevron down" color="dark-2" hoverColor="dark" />
      </div>
    </div>
  );
}
