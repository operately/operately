import { yesNoQuestion, textAreaQuestion } from "@/components/Survey";

const phaseChangeQuestionMapper = {
  "planning->execution": phaseCompletedQuestions,
  "planning->control": phaseCompletedQuestions,
  "planning->completed": retrospectiveQuestions,
  "planning->canceled": retrospectiveQuestions,
  "planning->paused": pauseQuestions,

  "execution->planning": revertPhaseQuestions,
  "execution->control": phaseCompletedQuestions,
  "execution->completed": retrospectiveQuestions,
  "execution->canceled": retrospectiveQuestions,
  "execution->paused": pauseQuestions,

  "control->planning": revertPhaseQuestions,
  "control->execution": revertPhaseQuestions,
  "control->completed": retrospectiveQuestions,
  "control->canceled": retrospectiveQuestions,
  "control->paused": pauseQuestions,

  "completed->planning": restartQuestions,
  "completed->execution": restartQuestions,
  "completed->control": restartQuestions,

  "canceled->planning": restartQuestions,
  "canceled->execution": restartQuestions,
  "canceled->control": restartQuestions,
};

export function getPhaseChangeQuestions(oldPhase: string, newPhase: string) {
  const key = `${oldPhase}->${newPhase}`;
  const mapper = phaseChangeQuestionMapper[key];
  if (!mapper) {
    throw new Error(`No phase change questions for ${key}`);
  }

  return mapper(oldPhase, newPhase);
}

function phaseCompletedQuestions(oldPhase: string) {
  return [
    yesNoQuestion("schedule", "Schedule", `Was the ${oldPhase} phase completed on schedule?`),
    yesNoQuestion("costs", "Costs", `Was the ${oldPhase} phase completed within budget?`),
    yesNoQuestion("team", "Team", "Was the team staffed with suitable roles?"),
    yesNoQuestion("risks", "Risks", "Are there any outstanding project risks?"),
    textAreaQuestion("deliverables", "Deliverables", `Summarize the deliverables of the ${oldPhase} phase`),
  ];
}

function retrospectiveQuestions() {
  return [
    textAreaQuestion("what-went-well", "", "What went well?"),
    textAreaQuestion("what-could-be-better", "", "What could've gone better?"),
    textAreaQuestion("what-we-learned", "", "What we learned?"),
  ];
}

function pauseQuestions() {
  return [textAreaQuestion("reason", "Reason", "Why was the project paused?")];
}

function restartQuestions() {
  return [textAreaQuestion("why-are-you-restarting", "", "Why are you restarting this project?")];
}

function revertPhaseQuestions(_oldPhase: string, newPhase: string) {
  return [textAreaQuestion("why-are-you-switching-back", "", "Why are you switching back to " + newPhase + "?")];
}
