defmodule OperatelyWeb.GraphQL.Mutations.Objectives do
  use Absinthe.Schema.Notation

  object :objective_mutations do
    field :create_objective, :objective do
      arg :input, non_null(:create_objective_input)

      resolve fn args, _ ->
        owner_id = args.input.owner_id

        ownership = %{
          target_type: :objective,
          person_id: owner_id
        }

        params =
          args.input
          |> Map.delete(:owner_id)
          |> Map.put(:ownership, ownership)

        Operately.Okrs.create_objective(params)
      end
    end
  end
end
