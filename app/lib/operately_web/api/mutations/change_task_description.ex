defmodule OperatelyWeb.Api.Mutations.ChangeTaskDescription do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2, preload: 2]
  import Operately.Access.Filters, only: [filter_by_edit_access: 3, forbidden_or_not_found: 3]

  alias Operately.Repo

  inputs do
    field :task_id, :id, null: false
    field :description, :json, null: false
  end

  outputs do
    field? :task, :task, null: true
  end

  def call(conn, inputs) do
    author = me(conn)

    case load_task(author, inputs.task_id) do
      nil ->
        query(inputs.task_id)
        |> forbidden_or_not_found(author.id, join_parent: :project)

      task ->
        {:ok, task} = Operately.Operations.TaskDescriptionChange.run(author, task, inputs.description)

        {:ok, %{task: Serializer.serialize(task, level: :essential)}}
    end
  end

  defp load_task(author, task_id) do
    query(task_id)
    |> preload(:group)
    |> filter_by_edit_access(author.id, join_parent: :project)
    |> Repo.one()
  end

  defp query(task_id) do
    from(t in Operately.Tasks.Task,
      join: p in assoc(t, :project), as: :project,
      where: t.id == ^task_id
    )
  end
end
