import React from "react";

import { Avatar } from "../../Avatar";
import { ProfilePage } from "../index";
import { IconMail } from "../../icons";

export { Colleagues } from "./Colleagues";

export function PageHeader({ person }: { person: ProfilePage.Person }) {
  return (
    <div className="mt-4 px-4 flex items-center gap-4">
      <Avatar person={person} size={72} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold">{person.fullName}</div>
        </div>
        <div className="font-medium">{person.title}</div>
      </div>
    </div>
  );
}

export function Contact({ person }: { person: ProfilePage.Person }) {
  return (
    <div className="pb-6">
      <div className="text-xs mb-2 uppercase font-bold">Contact</div>
      <div className="flex items-center gap-1 font-medium">
        <IconMail size={20} className="text-content-dimmed" />
        {person.email}
      </div>
    </div>
  );
}
