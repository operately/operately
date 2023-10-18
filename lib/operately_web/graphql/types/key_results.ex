defmodule OperatelyWeb.Graphql.Types.KeyResults do
  use Absinthe.Schema.Notation

  object :key_result do
    field :id, non_null(:id)
    field :name, non_null(:string)
    field :status, :string
    field :updated_at, non_null(:date)
    field :steps_completed, :integer
    field :steps_total, :integer

    field :owner, :person do
      resolve fn key_result, _, _ ->
        if key_result.owner_id == nil do
          {:ok, nil}
        else
          {:ok, Operately.People.get_person!(key_result.owner_id)}
        end
      end
    end

    field :group, :group do
      resolve fn key_result, _, _ ->
        if key_result.group_id == nil do
          {:ok, nil}
        else
          {:ok, Operately.Groups.get_group!(key_result.group_id)}
        end
      end
    end
  end

  input_object :create_key_result_input do
    field :name, non_null(:string)
    field :objective_id, non_null(:id)
  end
end
