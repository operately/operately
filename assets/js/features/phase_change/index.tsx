import { Project, ProjectPhase } from "@/graphql/Projects";

import { Handler } from "./handler";
import { Restart } from "./handlers/restart";
import { Review } from "./handlers/review";
import { Retrospective } from "./handlers/retrospective";
import { RevertPhase } from "./handlers/revert_phase";
import { Pause } from "./handlers/pause";

const handlers = {
  "planning->execution": Review,
  "planning->control": Review,
  "planning->completed": Retrospective,
  "planning->canceled": Retrospective,
  "planning->paused": Pause,

  "execution->planning": RevertPhase,
  "execution->control": Review,
  "execution->completed": Retrospective,
  "execution->canceled": Retrospective,
  "execution->paused": Pause,

  "control->planning": RevertPhase,
  "control->execution": RevertPhase,
  "control->completed": Retrospective,
  "control->canceled": Retrospective,
  "control->paused": Pause,

  "completed->planning": Restart,
  "completed->execution": Restart,
  "completed->control": Restart,

  "canceled->planning": Restart,
  "canceled->execution": Restart,
  "canceled->control": Restart,
};

export function handler(project: Project, from: ProjectPhase, to: ProjectPhase): Handler {
  const key = `${from}->${to}`;
  const handler = handlers[key];

  if (handler) {
    return new handler(project, from, to);
  } else {
    throw new Error(`Unknown phase change: ${from} -> ${to}`);
  }
}
