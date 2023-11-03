import React from "react";

import { Indicator, explanation } from "@/components/ProjectHealthIndicators";

export const options = {
  status: {
    on_track: {
      label: <Indicator value="on_track" type="status" />,
      explanation: explanation("status", "on_track"),
    },
    at_risk: {
      label: <Indicator value="at_risk" type="status" />,
      explanation: explanation("status", "at_risk"),
    },
    off_track: {
      label: <Indicator value="off_track" type="status" />,
      explanation: explanation("status", "off_track"),
    },
    paused: {
      label: <Indicator value="paused" type="status" />,
      explanation: explanation("status", "paused"),
    },
  },

  schedule: {
    on_schedule: {
      label: <Indicator value="on_schedule" type="schedule" />,
      explanation: explanation("schedule", "on_schedule"),
    },
    small_delays: {
      label: <Indicator value="small_delays" type="schedule" />,
      explanation: explanation("schedule", "small_delays"),
    },
    major_delays: {
      label: <Indicator value="major_delays" type="schedule" />,
      explanation: explanation("schedule", "major_delays"),
    },
  },

  budget: {
    within_budget: {
      label: <Indicator value="within_budget" type="budget" />,
      explanation: explanation("budget", "within_budget"),
    },
    not_within_budget: {
      label: <Indicator value="not_within_budget" type="budget" />,
      explanation: explanation("budget", "not_within_budget"),
    },
  },

  team: {
    staffed: {
      label: <Indicator value="staffed" type="team" />,
      explanation: explanation("team", "staffed"),
    },
    missing_roles: {
      label: <Indicator value="missing_roles" type="team" />,
      explanation: explanation("team", "missing_roles"),
    },
    key_roles_missing: {
      label: <Indicator value="key_roles_missing" type="team" />,
      explanation: explanation("team", "key_roles_missing"),
    },
  },

  risks: {
    no_known_risks: {
      label: <Indicator value="no_known_risks" type="risks" />,
      explanation: explanation("risks", "no_known_risks"),
    },
    minor_risks: {
      label: <Indicator value="minor_risks" type="risks" />,
      explanation: explanation("risks", "minor_risks"),
    },
    major_risks: {
      label: <Indicator value="major_risks" type="risks" />,
      explanation: explanation("risks", "major_risks"),
    },
  },
};
