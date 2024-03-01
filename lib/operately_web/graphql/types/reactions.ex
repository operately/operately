defmodule OperatelyWeb.Graphql.Types.Reactions do
  use Absinthe.Schema.Notation
  import OperatelyWeb.Graphql.TypeHelpers

  object :reaction do
    field :id, non_null(:id)
    field :emoji, non_null(:string)
    field :reaction_type, non_null(:string)

    assoc_field :person, non_null(:person)
  end
end
