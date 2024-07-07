defmodule OperatelyWeb.Api.Queries.GetProjectCheckIns do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.CheckIn

  inputs do
    field :project_id, :string
    field :include_author, :boolean
    field :include_project, :boolean
    field :include_reactions, :boolean
  end

  outputs do
    field :project_check_ins, list_of(:project_check_in)
  end

  def call(_conn, inputs) do
    case decode_id(inputs[:project_id]) do
      {:ok, id} -> 
        project_check_ins = load(id, inputs)
        {:ok, %{project_check_ins: Serializer.serialize(project_check_ins, level: :essential)}}
      {:error, _} -> {:error, :bad_request}
    end
  end

  defp load(id, inputs) do
    requested = extract_include_filters(inputs)

    query = from p in CheckIn, where: p.project_id == ^id, preload: [:acknowledged_by]

    query
    |> include_requested(requested)
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
