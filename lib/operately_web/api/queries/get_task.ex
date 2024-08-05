defmodule OperatelyWeb.Api.Queries.GetTask do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2]
  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.Tasks.Task

  inputs do
    field :id, :string
    field :include_assignees, :boolean
    field :include_milestone, :boolean
    field :include_project, :boolean
  end

  outputs do
    field :task, :task
  end

  def call(conn, inputs) do
    {:ok, id} = decode_id(inputs[:id])
    task = load(me(conn), id, inputs)

    if task do
      {:ok, %{task: Serializer.serialize(task, level: :full)}}
    else
      {:error, :not_found}
    end
  end

  defp load(person, id, inputs) do
    include_filters = extract_include_filters(inputs)

    from(t in Task,
      join: m in assoc(t, :milestone),
      join: p in assoc(m, :project), as: :project,
      where: t.id == ^id
    )
    |> Task.scope_company(person.company_id)
    |> filter_by_view_access(person.id, named_binding: :project)
    |> include_requested(include_filters)
    |> Repo.one()
  end

  defp include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_assignees -> from t in q, preload: [:assigned_people]
        :include_milestone -> from [_, m, p] in q, preload: [milestone: {m, [project: p]}]
        :include_project -> from [project: p] in q, preload: [project: p]
        e -> raise "Unknown include filter: #{e}"
      end
    end)
  end
end
