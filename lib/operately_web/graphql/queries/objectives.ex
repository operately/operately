defmodule OperatelyWeb.GraphQL.Queries.Objectives do
  use Absinthe.Schema.Notation

  object :objective_queries do
    field :objectives, list_of(:objective) do
      resolve fn _, _, _ ->
        objectives = Operately.Okrs.list_objectives()

        {:ok, objectives}
      end
    end

    field :objective, :objective do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        objective = Operately.Okrs.get_objective!(args.id)

        {:ok, objective}
      end
    end
  end
end
