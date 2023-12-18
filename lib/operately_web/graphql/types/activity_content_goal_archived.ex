defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalArchived do
  use Absinthe.Schema.Notation

  object :activity_content_goal_archived do
    field :goal, non_null(:goal) do
      resolve fn activity, _, _ ->
        id = activity.content["goal_id"]

        {:ok, Operately.Goals.get_goal!(id)}
      end
    end
  end
end
