defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalCheckInAcknowledgement do
  use Absinthe.Schema.Notation

  object :activity_content_goal_check_in_acknowledgement do
    field :goal, non_null(:goal) do
      resolve fn activity, _, _ ->
        project = Operately.Goals.get_goal!(activity.content["goal_id"])

        {:ok, project}
      end
    end

    field :update, non_null(:update) do
      resolve fn activity, _, _ ->
        id = activity.content["update_id"]
        update = Operately.Updates.get_update!(id)

        {:ok, update}
      end
    end
  end
end
