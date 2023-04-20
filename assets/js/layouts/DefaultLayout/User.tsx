import React from 'react';

import Avatar, {AvatarSize} from '../../components/Avatar';
import Icon from '../../components/Icon';
import { useMe } from '../../graphql/Me';

export default function User() {
  const { data, loading, error } = useMe();

  if (loading) return <div></div>;
  if (error) return <div></div>;

  return (
    <div className="fixed top-2 right-2 p-[18px] flex gap-10 items-center justify-between bg-light-2 rounded-lg w-[300px]">
      <div className="flex gap-2 items-center">
        <Avatar size={AvatarSize.Small} person={data.me} />
        <span className="font-semibold">{data.me.fullName}</span>
      </div>

      <div className="hover:cursor-pointer flex items-center gap-2">
        <Icon name="settings" color="dark-2" hoverColor="dark" />
        <Icon name="chevron down" color="dark-2" hoverColor="dark" />
      </div>
    </div>
  );
}
