import React from "react";

import { Handler } from "../handler";
import { Question, textAreaQuestion } from "../questions";

export class RevertPhase extends Handler {
  updateType(): string {
    return "review";
  }

  questions(): Question[] {
    return [textAreaQuestion("why-are-you-switching-back", "Why are you switching back to " + this.to + "?")];
  }

  formHeader(): React.FC {
    return () => {
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: REVERTING PROJECT PHASE</div>
          <div className="text-4xl font-bold mx-auto">Going back to previous phase</div>
        </div>
      );
    };
  }
}
