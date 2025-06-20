defmodule OperatelyWeb.Api.Queries.GetProjectCheckIns do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters

  alias Operately.Projects.CheckIn

  inputs do
    field? :project_id, :string, null: true
    field? :include_author, :boolean, null: true
    field? :include_project, :boolean, null: true
    field? :include_reactions, :boolean, null: true
  end

  outputs do
    field? :project_check_ins, list_of(:project_check_in), null: true
  end

  def call(conn, inputs) do
    case decode_id(inputs[:project_id]) do
      {:ok, id} ->
        project_check_ins = load(me(conn), id, inputs)
        {:ok, %{project_check_ins: Serializer.serialize(project_check_ins, level: :essential)}}
      {:error, _} -> {:error, :bad_request}
    end
  end

  defp load(person, id, inputs) do
    requested = extract_include_filters(inputs)

    query = from p in CheckIn, where: p.project_id == ^id, preload: [:acknowledged_by]

    query
    |> include_requested(requested)
    |> filter_by_view_access(person.id, join_parent: :project)
    |> Repo.all()
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_author -> from p in q, preload: [:author]
        :include_project -> from p in q, preload: [:project]
        :include_reactions -> from p in q, preload: [reactions: :person]
        _ -> raise ArgumentError, "Unknown include filter: #{inspect(include)}"
      end
    end)
  end
end
