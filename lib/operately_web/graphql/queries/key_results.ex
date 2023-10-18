defmodule OperatelyWeb.Graphql.Queries.KeyResults do
  use Absinthe.Schema.Notation

  object :key_result_queries do
    field :key_results, list_of(:key_result) do
      arg :objective_id, non_null(:id)

      resolve fn args, _ ->
        objective_id = args.objective_id
        key_results = Operately.Okrs.list_key_results!(objective_id)

        {:ok, key_results}
      end
    end
  end
end
