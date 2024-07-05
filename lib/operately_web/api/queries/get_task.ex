defmodule OperatelyWeb.Api.Queries.GetTask do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Tasks.Task
  import Ecto.Query, only: [from: 2]

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
    {:ok, %{task: Serializer.serialize(task, level: :full)}}
  end

  defp load(person, id, inputs) do
    include_filters = extract_include_filters(inputs)

    (from p in Task, where: p.id == ^id)
    |> Task.scope_company(person.company_id)
    |> include_requested(include_filters)
    |> Repo.one()
  end

  defp include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_assignees -> from p in q, preload: [:assigned_people]
        :include_milestone -> from p in q, preload: [:milestone]
        :include_project -> from p in q, preload: [:project]
        e -> raise "Unknown include filter: #{e}"
      end
    end)
  end
end
