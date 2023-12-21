defmodule OperatelyWeb.Graphql.Types.ActivityContentGoalCheckIn do
  use Absinthe.Schema.Notation

  object :activity_content_goal_check_in do
    field :example_field, non_null(:string) do
      resolve fn _parent, _args, _resolution ->
        "Hello World"
      end
    end
  end
end
