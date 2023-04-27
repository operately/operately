defmodule OperatelyWeb.GraphQL.Types.KeyResults do
  use Absinthe.Schema.Notation

  object :key_result do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :status, :string
    field :updated_at, non_null(:date)
    field :steps_completed, :integer
    field :steps_total, :integer
  end

  input_object :create_key_result_input do
    field :name, non_null(:string)
    field :objective_id, non_null(:id)
  end
end
