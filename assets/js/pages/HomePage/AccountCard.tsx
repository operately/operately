import React from "react";

import { Card } from "./Card";
import Avatar from "@/components/Avatar";
import * as Icons from "@tabler/icons-react";

import { areNotificationsEnabled } from "@/graphql/Me";

export function AccountCard({ me, company }) {
  return (
    <Card linkTo="/account">
      <div className="flex flex-col items-center justify-center h-full">
        <Avatar size="xxlarge" person={me} />

        <div className="mt-4 text-center">
          <h1 className="text-2xl font-extrabold">{me.fullName}</h1>
          <p className="text-sm">
            {me.title} at {company.name}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 w-full">
          <div className="flex items-center text-sm gap-2">
            {areNotificationsEnabled(me) ? (
              <Icons.IconBellRinging size={16} className="text-green-400" />
            ) : (
              <Icons.IconBellOff size={16} className="text-gray-400" />
            )}
            Notifications {me.sendDailySummary ? "on" : "off"}
          </div>

          <div className="flex items-center text-sm gap-2">
            <Icons.IconBuilding size={16} className="text-sky-400" /> In the office
          </div>
        </div>
      </div>
    </Card>
  );
}
