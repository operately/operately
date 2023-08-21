defmodule OperatelyWeb.GraphQL.Queries.Updates do
  use Absinthe.Schema.Notation

  input_object :updates_filter do
    field :project_id, :id
  end

  object :update_queries do
    field :updates, non_null(list_of(:update)) do
      arg :filter, non_null(:updates_filter)

      resolve fn args, _ ->
        update = Operately.Updates.list_updates(args.filter.project_id, "project")

        {:ok, update}
      end
    end

    field :update, non_null(:update) do
      arg :id, non_null(:id)

      resolve fn args, _ ->
        update = Operately.Updates.get_update!(args.id)

        {:ok, update}
      end
    end
  end
end
