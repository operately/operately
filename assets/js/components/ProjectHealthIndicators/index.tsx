import * as React from "react";
import * as Icons from "@tabler/icons-react";

const indicators = {
  status: {
    on_track: {
      title: "On Track",
      color: "text-green-400",
      explanation: "Progressing well, we are delivering results",
    },
    at_risk: {
      title: "At Risk",
      color: "text-yellow-400",
      explanation: "Small concerns, but we are confident that we will deliver",
    },
    off_track: {
      title: "Off Track",
      color: "text-red-400",
      explanation: "Major problems, not confident that we will deliver",
    },
    paused: {
      title: "Paused",
      color: "text-gray-400",
      explanation: "Temporarely paused. We will resume soon.",
    },
  },
  schedule: {
    on_schedule: {
      title: "On Schedule",
      color: "text-green-400",
      explanation: "We have a timeline, and we are hitting the deadlines",
    },
    small_delays: {
      title: "Small Delays",
      color: "text-yellow-400",
      explanation: "We are experiecing small delays in the schedule",
    },
    major_delays: {
      title: "Major Delays",
      color: "text-red-400",
      explanation: "We are experiecing small delays in the schedule",
    },
  },
  budget: {
    within_budget: {
      title: "Within Budget",
      color: "text-green-400",
      explanation: "We are with budget, and we are not expecting any changes",
    },
    not_within_budget: {
      title: "Not Within Budget",
      color: "text-red-400",
      explanation: "We are not able to deliver within budget",
    },
  },
  team: {
    staffed: {
      title: "Staffed with suitable roles",
      color: "text-green-400",
      explanation: "Everyone is ready and we are able to deliver",
    },
    missing_roles: {
      title: "Missing roles",
      color: "text-yellow-400",
      explanation: "Missing roles in the team, but we are able to deliver",
    },
    key_roles_missing: {
      title: "Key roles missing",
      color: "text-red-400",
      explanation: "Missing key roles in the team, not able to deliver",
    },
  },
  risks: {
    no_known_risks: {
      title: "No known risks",
      color: "text-green-400",
      explanation: "We are not aware of any risks that could impact the project",
    },
    minor_risks: {
      title: "Minor risks",
      color: "text-yellow-400",
      explanation: "Minor risks, we can manage them",
    },
    major_risks: {
      title: "Major risks",
      color: "text-red-400",
      explanation: "Major risks that significantly impact the project",
    },
  },
};

export function Indicator({ value, type }) {
  const { title, color } = findOptions(type, value);

  return (
    <span className="font-medium flex items-center gap-2">
      <Icons.IconCircleFilled size={12} className={color} />
      {title}
    </span>
  );
}

export function explanation(type: string, value: string) {
  return findOptions(type, value).explanation;
}

function findOptions(type: string, value: string) {
  const indicatorType = indicators[type];
  if (!indicatorType) {
    throw new Error(`Indicator type ${type} not found`);
  }

  const valueType = indicatorType[value];
  if (!valueType) {
    throw new Error(`Indicator value ${value} in type ${type} not found`);
  }

  return valueType;
}
