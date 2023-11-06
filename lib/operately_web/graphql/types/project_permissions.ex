defmodule OperatelyWeb.Graphql.Types.ProjectPermissions do
  use Absinthe.Schema.Notation

  object :project_permissions do
    field :can_view, non_null(:boolean)
    field :can_edit_contributors, non_null(:boolean)

    field :can_create_milestone, non_null(:boolean)
    field :can_edit_milestone, non_null(:boolean)
    field :can_delete_milestone, non_null(:boolean)

    field :can_check_in, non_null(:boolean)
  end
end
