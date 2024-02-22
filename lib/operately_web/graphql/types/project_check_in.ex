defmodule OperatelyWeb.Graphql.Types.ProjectCheckIn do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :project_check_in do
    field :id, non_null(:id)
    field :status, non_null(:string)

    json_field :description, non_null(:string)
    assoc_field :author, non_null(:person)
  end
end
