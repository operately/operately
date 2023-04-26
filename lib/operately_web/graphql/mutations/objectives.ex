defmodule OperatelyWeb.GraphQL.Mutations.Objectives do
  use Absinthe.Schema.Notation

  object :objective_mutations do
    field :create_objective, :objective do
      arg :input, non_null(:create_objective_input)

      resolve fn args, _ ->
        Operately.Okrs.create_objective(args.input)
      end
    end
  end
end
