import React from "react";
import { Handler } from "../handler";
import { Question, textAreaQuestion } from "../questions";

export class Restart extends Handler {
  updateType(): string {
    return "review";
  }

  questions(): Question[] {
    return [textAreaQuestion("why-are-you-restarting", "Why are you restarting this project?")];
  }

  formHeader(): React.FC {
    return () => (
      <div>
        <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: RESTARTING PROJECT</div>
        <div className="text-4xl font-bold mx-auto">Restarting work on the project</div>
      </div>
    );
  }
}
