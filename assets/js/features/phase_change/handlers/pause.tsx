import React from "react";
import { Handler } from "../handler";
import { Question, textAreaQuestion } from "../questions";

export class Pause extends Handler {
  updateType(): string {
    return "review";
  }

  questions(): Question[] {
    return [
      textAreaQuestion("why-are-you-pausing", "Why are you pausing this project?"),
      textAreaQuestion("when-will-you-resume", "When will you resume this project?"),
    ];
  }

  formHeader(): React.FC {
    return () => (
      <div>
        <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: PAUSING PROJECT</div>
        <div className="text-4xl font-bold mx-auto">Pausing work on the project</div>
      </div>
    );
  }
}
