import { Project, ProjectPhase } from "@/graphql/Projects";

import { Handler } from "./handler";
import { Restart } from "./handlers/restart";
import { Review } from "./handlers/review";
import { Retrospective } from "./handlers/retrospective";
import { RevertPhase } from "./handlers/revert_phase";

export function handler(project: Project, from: ProjectPhase, to: ProjectPhase): Handler {
  if (from === to) throw new Error("Phase change from and to are the same");

  if (from === "planning" && to === "execution") return new Review(project, from, to);
  if (from === "planning" && to === "control") return new Review(project, from, to);
  if (from === "planning" && to === "completed") return new Retrospective(project, from, to);
  if (from === "planning" && to === "canceled") return new Retrospective(project, from, to);

  if (from === "execution" && to === "planning") return new RevertPhase(project, from, to);
  if (from === "execution" && to === "control") return new Review(project, from, to);
  if (from === "execution" && to === "completed") return new Retrospective(project, from, to);
  if (from === "execution" && to === "canceled") return new Retrospective(project, from, to);

  if (from === "control" && to === "planning") return new RevertPhase(project, from, to);
  if (from === "control" && to === "execution") return new RevertPhase(project, from, to);
  if (from === "control" && to === "completed") return new Retrospective(project, from, to);
  if (from === "control" && to === "canceled") return new Retrospective(project, from, to);

  if (from === "completed" && to === "planning") return new Restart(project, from, to);
  if (from === "completed" && to === "execution") return new Restart(project, from, to);
  if (from === "completed" && to === "control") return new Restart(project, from, to);
  if (from === "completed" && to === "canceled") throw new Error("Cannot change from completed to canceled");

  if (from === "canceled" && to === "planning") return new Restart(project, from, to);
  if (from === "canceled" && to === "execution") return new Restart(project, from, to);
  if (from === "canceled" && to === "control") return new Restart(project, from, to);
  if (from === "canceled" && to === "completed") throw new Error("Cannot change from canceled to completed");

  throw new Error(`Unknown phase change: ${from} -> ${to}`);
}

// const terminalPhases = ["completed", "canceled"];
// const nonTerminalPhases = ["planning", "execution", "control"];

// if (terminalPhases.includes(newPhase)) {
//   return [
//     {
//       name: "what-went-well",
//       title: "What went well?",
//       type: "text_area",
//     },
//     {
//       name: "what-could-be-better",
//       title: "What could've gone better?",
//       type: "text_area",
//     },
//     {
//       name: "what-we-learned",
//       title: "What we learned?",
//       type: "text_area",
//     },
//   ];
// } else if (newPhase === "paused") {
//   return [
//     {
//       name: "why-are-you-pausing",
//       title: "Why are you pausing this project?",
//       type: "text_area",
//     },
//     {
//       name: "when-will-you-resume",
//       title: "When will you resume?",
//       type: "text_area",
//     },
//   ];
// } else if (terminalPhases.includes(currentPhase) && nonTerminalPhases.includes(newPhase)) {
//   return [
//     {
//       name: "why-are-you-restarting",
//       title: "Why are you restarting this project?",
//       type: "text_area",
//     },
//   ];
// } else if (nonTerminalPhases.includes(currentPhase) && nonTerminalPhases.includes(newPhase)) {
//   const oldPhaseIndex = nonTerminalPhases.indexOf(currentPhase);
//   const newPhaseIndex = nonTerminalPhases.indexOf(newPhase);

//   if (oldPhaseIndex < newPhaseIndex) {
//     return [
//       {
//         name: "schedule",
//         title: "Schedule",
//         question: `Was the ${currentPhase} phase completed on schedule?`,
//         type: "yes_no_with_comments",
//       },
//       {
//         name: "costs",
//         title: "Costs",
//         question: `Was the ${currentPhase} phase completed within budget?`,
//         type: "yes_no_with_comments",
//       },
//       {
//         name: "team",
//         title: "Team",
//         question: "Was the team staffed with suitable roles?",
//         type: "yes_no_with_comments",
//       },
//       {
//         name: "risks",
//         title: "Risks",
//         question: "Are there any outstanding project risks?",
//         type: "yes_no_with_comments",
//       },
//       {
//         name: "deliverables",
//         title: "Deliverables",
//         question: `Summarize the deliverables of the ${currentPhase} phase`,
//         type: "text_area",
//       },
//     ];
//   } else {
//     return [
//       {
//         name: "why-are-you-switching-back",
//         title: "Why are you switching back to " + newPhase + "?",
//         type: "text_area",
//       },
//     ];
//   }
// } else {
//   throw new Error(`Unknown phase transition: ${currentPhase} -> ${newPhase}`);
// }

// type YesNoQuestion = {
//   name: string;
//   title: string;
//   question: string;
//   type: "yes_no_with_comments";
// };

// type TextAreaQuestion = {
//   name: string;
//   title: string;
//   question?: string;
//   type: "text_area";
// };

// type Question = YesNoQuestion | TextAreaQuestion;

// type YesNoAnswer = {
//   answer: "yes" | "no";
//   comments: string;
// };

// type TextAreaAnswer = {
//   answer: string;
// };

// type Answer = YesNoAnswer | TextAreaAnswer;
// type Answers = Record<string, Answer>;

// function createQuestions(currentPhase: Projects.ProjectPhase, newPhase: Projects.ProjectPhase): Question[] {
//   const handler = PhaseChange.handler(currentPhase, newPhase);
//   return handler.questions();
// }

// function PausedHeader() {
//   return (
//     <div>
//       <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: PAUSING THE PROJECT</div>
//       <div className="text-4xl font-bold mx-auto">Project Pause</div>
//     </div>
//   );
// }
