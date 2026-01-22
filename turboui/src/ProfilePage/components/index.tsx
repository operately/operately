import React from "react";

import { Avatar } from "../../Avatar";
import { SecondaryButton } from "../../Button";
import { IconMail } from "../../icons";
import { ProfilePage } from "../index";

export { AboutMe } from "./AboutMe";
export { Colleagues } from "./Colleagues";

export function PageHeader(props: ProfilePage.Props) {
  return (
    <div className="my-5 px-4 mr-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Avatar person={props.person} size={52} />

        <div className="flex flex-col">
          <div className="text-lg font-bold">{props.person.fullName!}</div>
          <div className="font-medium text-sm">{props.person.title}</div>
        </div>
      </div>

      {props.canEditProfile && (
        <SecondaryButton size="sm" linkTo={props.editProfilePath}>
          Edit Profile
        </SecondaryButton>
      )}
    </div>
  );
}

export function Contact({ person }: { person: ProfilePage.Person }) {
  return (
    <div>
      <div className="text-xs mb-2 uppercase font-bold">Contact</div>
      <div className="flex items-center gap-1 font-medium">
        <IconMail size={20} className="text-content-dimmed" />
        {person.email}
      </div>
    </div>
  );
}
