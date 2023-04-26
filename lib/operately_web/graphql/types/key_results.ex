defmodule OperatelyWeb.GraphQL.Types.KeyResults do
  use Absinthe.Schema.Notation

  object :key_result do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :status, non_null(:string)
    field :updated_at, non_null(:date)
    field :steps_completed, non_null(:integer)
    field :steps_total, non_null(:integer)
  end
end
