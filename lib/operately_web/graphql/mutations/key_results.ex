defmodule OperatelyWeb.GraphQL.Mutations.KeyResults do
  use Absinthe.Schema.Notation

  object :key_result_mutations do
    field :create_key_result, :key_result do
      arg :input, non_null(:create_key_result_input)

      resolve fn args, _ ->
        Operately.Okrs.create_key_result(args.input)
      end
    end
  end

end
