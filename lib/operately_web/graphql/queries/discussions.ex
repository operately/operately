defmodule OperatelyWeb.Graphql.Queries.Discussions do
  use Absinthe.Schema.Notation

  object :discussion_queries do
    field :discussion, non_null(:discussion) do
      arg :id, non_null(:id)

      resolve fn _, args, _ ->
        update = Operately.Updates.get_update!(args.id)

        {:ok, update}
      end
    end

    field :discussions, list_of(:discussion) do
      arg :space_id, non_null(:id)

      resolve fn _, args, _ ->
        update = Operately.Updates.list_updates(
          args.space_id, 
          :space,
          :project_discussion)

        {:ok, update}
      end
    end
  end
end
