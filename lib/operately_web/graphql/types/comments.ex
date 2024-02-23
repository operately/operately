defmodule OperatelyWeb.Graphql.Types.Comments do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :comment do
    field :id, non_null(:id)
    field :inserted_at, non_null(:naive_datetime)

    json_field :message, non_null(:string)
    assoc_field :author, non_null(:person)
    assoc_field :reactions, non_null(list_of(:reaction))
  end
end
