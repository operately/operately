defmodule OperatelyWeb.GraphQL.Types.Person do
  use Absinthe.Schema.Notation

  object :person do
    field :id, non_null(:id)
    field :full_name, non_null(:string)
    field :title, :string
    field :avatar_url, :string
  end
end
