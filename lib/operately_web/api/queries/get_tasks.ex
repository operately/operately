defmodule OperatelyWeb.Api.Queries.GetTasks do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  import Ecto.Query, only: [from: 2]

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

    (from t in Task, as: :task)
    |> Task.scope_company(person.company_id)
    |> Task.scope_milestone(milestone_id)
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
