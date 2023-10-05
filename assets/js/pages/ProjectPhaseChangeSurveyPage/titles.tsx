const phaseChangeQuestionMapper = {
  "planning->execution": "Project Review",
  "planning->control": "Project Review",
  "planning->completed": "Project Retrospective",
  "planning->canceled": "Project Retrospective",
  "planning->paused": "Putting the project on hold",

  "execution->planning": "Reverting to Planning",
  "execution->control": "Project Review",
  "execution->completed": "Project Retrospective",
  "execution->canceled": "Project Retrospective",
  "execution->paused": "Putting the project on hold",

  "control->planning": "Reverting to Planning",
  "control->execution": "Reverting to Execution",
  "control->completed": "Project Retrospective",
  "control->canceled": "Project Retrospective",
  "control->paused": "Putting the project on hold",

  "completed->planning": "Reverting to Planning",
  "completed->execution": "Reverting to Execution",
  "completed->control": "Reverting to Control",

  "canceled->planning": "Reverting to Planning",
  "canceled->execution": "Reverting to Execution",
  "canceled->control": "Reverting to Control",
};

export function getTitle(oldPhase: string, newPhase: string): string {
  return phaseChangeQuestionMapper[`${oldPhase}->${newPhase}`];
}
