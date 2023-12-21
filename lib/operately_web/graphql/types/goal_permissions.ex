defmodule OperatelyWeb.Graphql.Types.GoalPermissions do
  use Absinthe.Schema.Notation

  object :goal_permissions do
    field :can_check_in, non_null(:boolean)
  end
end
