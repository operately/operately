defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalClosing do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :activity_content_goal_closing do
    activity_content_field :company_id, non_null(:string)
    activity_content_field :space_id, non_null(:string)
    activity_content_field :goal_id, non_null(:string)
    activity_content_field :success, :string

    field :goal, non_null(:goal) do
      resolve fn activity, _, _ ->
        {:ok, Operately.Goals.get_goal!(activity.content["goal_id"])}
      end
    end
  end
end
