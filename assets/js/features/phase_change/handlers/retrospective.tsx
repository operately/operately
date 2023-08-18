import React from "react";

import { Handler } from "../handler";
import { Question, textAreaQuestion } from "../questions";

export class Retrospective extends Handler {
  updateType(): string {
    return "retrospective";
  }

  questions(): Question[] {
    return [
      textAreaQuestion("what-went-well", "What went well?"),
      textAreaQuestion("what-could-be-better", "What could've gone better?"),
      textAreaQuestion("what-we-learned", "What we learned?"),
    ];
  }

  formHeader(): React.FC {
    const action = this.to === "completed" ? "completing" : "canceling";

    return () => {
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: {action} THE PROJECT</div>
          <div className="text-4xl font-bold mx-auto">Project Retrospective</div>
        </div>
      );
    };
  }
}
