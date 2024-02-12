defmodule OperatelyWeb.Graphql.Queries.Tasks do
  use Absinthe.Schema.Notation

  object :task_queries do
    field :tasks, list_of(:task) do
      arg :space_id, :id

      resolve fn _, args, _ ->
        tasks = Operately.Tasks.list_tasks(%{space_id: args[:space_id]})

        {:ok, tasks}
      end
    end
  end
end
