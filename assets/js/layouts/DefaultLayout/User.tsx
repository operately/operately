import React from 'react';

import Avatar, {AvatarSize} from '../../components/Avatar';

export default function User() {
  return (
    <div className="fixed top-2 right-2 p-[18px] flex gap-10 items-center justify-between bg-light-2 rounded-lg">
      <div className="flex gap-2 items-center">
        <Avatar size={AvatarSize.Small} person_full_name="Igor Sarcevic" />
        <span>Igor Sarcevic</span>
      </div>
    </div>
  );
}
