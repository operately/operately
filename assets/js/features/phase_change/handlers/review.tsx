import React from "react";

import { Handler } from "../handler";
import { Question, yesNoQuestion, textAreaQuestion } from "../questions";

export class Review extends Handler {
  updateType(): string {
    return "review";
  }

  questions(): Question[] {
    return [
      yesNoQuestion("schedule", "Schedule", `Was the ${this.from} phase completed on schedule?`),
      yesNoQuestion("costs", "Costs", `Was the ${this.from} phase completed within budget?`),
      yesNoQuestion("team", "Team", "Was the team staffed with suitable roles?"),
      yesNoQuestion("risks", "Risks", "Are there any outstanding project risks?"),
      textAreaQuestion("deliverables", "Deliverables", `Summarize the deliverables of the ${this.from} phase`),
    ];
  }

  formHeader(): React.FC {
    return () => {
      return (
        <div>
          <div className="uppercase text-white-1 tracking-wide w-full mb-2">CHECK-IN: PHASE CHANGE</div>
          <div className="text-4xl font-bold mx-auto">
            <span className="capitalize">{this.from}</span> -&gt; <span className="capitalize">{this.to}</span>
          </div>
        </div>
      );
    };
  }
}
