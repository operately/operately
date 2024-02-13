defmodule OperatelyWeb.Graphql.Queries.Tasks do
  use Absinthe.Schema.Notation

  object :task_queries do
    field :tasks, list_of(:task) do
      arg :space_id, :id
      arg :status, :string

      resolve fn _, args, _ ->
        tasks = Operately.Tasks.list_tasks(%{
          space_id: args[:space_id],
          status: String.to_existing_atom(args[:status])
        })

        {:ok, tasks}
      end
    end

    field :task, non_null(:task) do
      arg :id, non_null(:id)

      resolve fn _, args, _ ->
        task = Operately.Tasks.get_task!(args.id)

        {:ok, task}
      end
    end
  end
end
