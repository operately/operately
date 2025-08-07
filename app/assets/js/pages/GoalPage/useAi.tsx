import Api from "@/api";

import * as Companies from "@/models/companies";
import * as Goals from "@/models/goals";

import { GoalPage } from "turboui";

interface UseAiProps {
  goal: Goals.Goal;
  company: Companies.Company;
}

export function useAi(props: UseAiProps): GoalPage.Ai {
  const { company } = props;

  return {
    enabled: Companies.hasFeature(company, "ai"),
    startNewReview: ({ convoId }: { convoId: string }) => {
      Api.ai.startNewGoalReview({
        goalId: props.goal.id,
        convoId,
      });
    },
  };
}
