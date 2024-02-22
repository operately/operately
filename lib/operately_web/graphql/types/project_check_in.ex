defmodule OperatelyWeb.Graphql.Types.ProjectCheckIn do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :project_check_in do
    field :id, non_null(:id)
    field :status, non_null(:string)
    field :inserted_at, non_null(:date)

    json_field :description, non_null(:string)
    assoc_field :author, non_null(:person)
    assoc_field :project, non_null(:project)
  end
end
