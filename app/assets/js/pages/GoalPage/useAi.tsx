import Api from "@/api";

import * as Companies from "@/models/companies";
import * as Goals from "@/models/goals";
import * as Time from "@/utils/time";

import { GoalPage } from "turboui";

interface UseAiProps {
  goal: Goals.Goal;
  company: Companies.Company;
}

export function useAi(props: UseAiProps): GoalPage.Ai {
  const { company } = props;

  const getConversationMessages: GoalPage.GetConversationMessagesFn = async ({ convoRequestId }) => {
    const response = await Api.ai.getConversationMessages({ convoId: convoRequestId });
    return response.messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      timestamp: Time.parse(msg.timestamp)!,
      sender: "ai",
    }));
  };

  return {
    enabled: Companies.hasFeature(company, "ai"),
    startNewReview: ({ convoId }: { convoId: string }) => {
      Api.ai.startNewGoalReview({
        goalId: props.goal.id,
        convoId,
      });
    },
    getConversationMessages,
  };
}
