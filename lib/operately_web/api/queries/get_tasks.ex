defmodule OperatelyWeb.Api.Queries.GetTasks do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2]
  import Operately.Access.Filters, only: [filter_by_view_access: 3]

  alias Operately.Tasks.Task

  inputs do
    field :milestone_id, :string
    field :include_assignees, :boolean
  end

  outputs do
    field :tasks, list_of(:task)
  end

  def call(conn, inputs) do
    tasks = load(me(conn), inputs)

    {:ok, %{tasks: Serializer.serialize(tasks, level: :full)}}
  end

  defp load(person, inputs) do
    {:ok, milestone_id} = decode_id(inputs.milestone_id)
    include_filters = extract_include_filters(inputs)

    from(t in Task, as: :task,
      join: m in assoc(t, :milestone),
      join: p in assoc(m, :project), as: :project
    )
    |> Task.scope_company(person.company_id)
    |> Task.scope_milestone(milestone_id)
    |> filter_by_view_access(person.id, named_binding: :project)
    |> include_requested(include_filters)
    |> Repo.all()
  end

  defp include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_assignees -> from t in q, preload: [:assigned_people]
        e -> raise "Unknown include filter: #{e}"
      end
    end)
  end
end
