defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalReopening do
  use Absinthe.Schema.Notation

  import OperatelyWeb.Graphql.TypeHelpers

  object :activity_content_goal_reopening do
    activity_content_field :company_id, :string
    activity_content_field :goal_id, :string
    activity_content_field :message, :string
  end

end
