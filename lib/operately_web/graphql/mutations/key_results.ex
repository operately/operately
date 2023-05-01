defmodule OperatelyWeb.GraphQL.Mutations.KeyResults do
  use Absinthe.Schema.Notation

  object :key_result_mutations do
    field :create_key_result, :key_result do
      arg :input, non_null(:create_key_result_input)

      resolve fn args, _ ->
        Operately.Okrs.create_key_result(args.input)
      end
    end

    field :set_key_result_owner, :key_result do
      arg :id, non_null(:id)
      arg :owner_id, :id

      resolve fn args, _ ->
        Operately.Okrs.set_key_result_owner(args.id, args.owner_id)
      end
    end
  end

end
