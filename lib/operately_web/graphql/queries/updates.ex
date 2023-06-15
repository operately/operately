defmodule OperatelyWeb.GraphQL.Queries.Updates do
  use Absinthe.Schema.Notation

  object :update_queries do
    field :update, non_null(:activity) do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        update = Operately.Updates.get_update!(args.id)

        {:ok, update}
      end
    end
  end
end
