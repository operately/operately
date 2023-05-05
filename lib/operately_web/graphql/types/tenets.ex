defmodule OperatelyWeb.GraphQL.Types.Companies do
  use Absinthe.Schema.Notation

  object :tenet do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string
  end
end
