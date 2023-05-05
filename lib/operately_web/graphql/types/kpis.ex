defmodule OperatelyWeb.GraphQL.Types.Kpis do
  use Absinthe.Schema.Notation

  object :kpi do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :description, :string
  end
end
