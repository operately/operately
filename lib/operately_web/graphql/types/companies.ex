defmodule OperatelyWeb.GraphQL.Types.Companies do
  use Absinthe.Schema.Notation

  object :company do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :mission, non_null(:string)
  end
end
