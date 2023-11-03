import React from "react";
import * as Icons from "@tabler/icons-react";

const StatusOnTrack = () => <OptionLabelWithColor title="On Track" color="text-green-400" />;
const StatusAtRisk = () => <OptionLabelWithColor title="At Risk" color="text-yellow-400" />;
const StatusOffTrack = () => <OptionLabelWithColor title="Off Track" color="text-red-400" />;
const StatusPaused = () => <OptionLabelWithColor title="Paused" color="text-gray-400" />;

const ScheduleOnTrack = () => <OptionLabelWithColor title="On Schedule" color="text-green-400" />;
const ScheduleSmallDelays = () => <OptionLabelWithColor title="Small Delays" color="text-yellow-400" />;
const ScheduleMajorDelays = () => <OptionLabelWithColor title="Major Delays" color="text-red-400" />;

const BudgetWithinBudget = () => <OptionLabelWithColor title="Within Budget" color="text-green-400" />;
const BudgetNotWithinBudget = () => <OptionLabelWithColor title="Not Within Budget" color="text-red-400" />;

const TeamStaffed = () => <OptionLabelWithColor title="Staffed with suitable roles" color="text-green-400" />;
const TeamMissingRoles = () => <OptionLabelWithColor title="Missing roles" color="text-yellow-400" />;
const TeamKeyRolesMissing = () => <OptionLabelWithColor title="Key roles missing" color="text-red-400" />;

const RisksNoKnownRisks = () => <OptionLabelWithColor title="No known risks" color="text-green-400" />;
const RisksMinorRisks = () => <OptionLabelWithColor title="Minor risks" color="text-yellow-400" />;
const RisksMajorRisks = () => <OptionLabelWithColor title="Major risks" color="text-red-400" />;

function OptionLabelWithColor({ color, title }) {
  return (
    <span className="font-medium flex items-center gap-2">
      {title}
      <Icons.IconCircleFilled size={12} className={color} />
    </span>
  );
}

export const options = {
  status: {
    on_track: {
      label: <StatusOnTrack />,
      explanation: "Progressing well, we are delivering results",
    },
    at_risk: {
      label: <StatusAtRisk />,
      explanation: "Small concerns, but we are confident that we will deliver",
    },
    off_track: {
      label: <StatusOffTrack />,
      explanation: "Major problems, not confident that we will deliver",
    },
    paused: {
      label: <StatusPaused />,
      explanation: "Temporarely paused. We will resume soon.",
    },
  },

  schedule: {
    on_schedule: {
      label: <ScheduleOnTrack />,
      explanation: "We have a timeline, and we are hitting the deadlines",
    },
    small_delays: {
      label: <ScheduleSmallDelays />,
      explanation: "We are experiecing small delays in the schedule",
    },
    major_delays: {
      label: <ScheduleMajorDelays />,
      explanation: "We are experiecing small delays in the schedule",
    },
  },

  budget: {
    within_budget: {
      label: <BudgetWithinBudget />,
      explanation: "We are with budget, and we are not expecting any changes",
    },
    not_within_budget: {
      label: <BudgetNotWithinBudget />,
      explanation: "We are not able to deliver within budget",
    },
  },

  team: {
    staffed: {
      label: <TeamStaffed />,
      explanation: "Everyone is ready and we are able to deliver",
    },
    missing_roles: {
      label: <TeamMissingRoles />,
      explanation: "Missing roles in the team, but we are able to deliver",
    },
    key_roles_missing: {
      label: <TeamKeyRolesMissing />,
      explanation: "Missing key roles in the team, not able to deliver",
    },
  },

  risks: {
    no_risks: {
      label: <RisksNoKnownRisks />,
      explanation: "We are not aware of any risks that could impact the project",
    },
    minor_risks: {
      label: <RisksMinorRisks />,
      explanation: "Minor risks, we can manage them",
    },
    major_risks: {
      label: <RisksMajorRisks />,
      explanation: "Major risks that significantly impact the project",
    },
  },
};
