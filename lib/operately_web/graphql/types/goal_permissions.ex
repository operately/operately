defmodule OperatelyWeb.Graphql.Types.GoalPermissions do
  use Absinthe.Schema.Notation

  object :goal_permissions do
    field :can_edit, non_null(:boolean)
    field :can_check_in, non_null(:boolean)
    field :can_acknowledge_check_in, non_null(:boolean)
    field :can_complete, non_null(:boolean)
    field :can_archive, non_null(:boolean)
  end
end
