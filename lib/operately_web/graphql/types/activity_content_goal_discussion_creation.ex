defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalDiscussionCreation do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :activity_content_goal_discussion_creation do
    activity_content_field :company_id, :string
    activity_content_field :goal_id, :string

    field :goal, non_null(:goal) do
      resolve fn activity, _, _ ->
        {:ok, Operately.Goals.get_goal!(activity.content["goal_id"])}
      end
    end
  end
end
