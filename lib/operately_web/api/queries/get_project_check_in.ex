defmodule OperatelyWeb.Api.Queries.GetProjectCheckIn do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.CheckIn

  inputs do
    field :id, :string
    field :include_author, :boolean
    field :include_project, :boolean
    field :include_reactions, :boolean
  end

  outputs do
    field :project_check_in, :project_check_in
  end

  def call(conn, inputs) do
    case decode_id(inputs[:id]) do
      {:ok, id} -> 
        project_check_in = load(me(conn), id, inputs)

        if nil == project_check_in do
          {:error, :not_found}
        else
          {:ok, %{project_check_in: Serializer.serialize(project_check_in, level: :full)}}
        end
      {:error, _} -> {:error, :bad_request}
    end
  end

  defp load(person, id, inputs) do
    requested = extract_include_filters(inputs)

    query = from p in CheckIn, 
      where: p.id == ^id, 
      preload: [:acknowledged_by]

    query
    |> CheckIn.scope_company(person.company_id)
    |> include_requested(requested)
    |> Repo.one()
    |> preload_project_permissions()
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_author -> from p in q, preload: [:author]
        :include_project -> from p in q, preload: [project: [:reviewer], contributors: :person]
        :include_reactions -> from p in q, preload: [reactions: :person]
        _ -> raise ArgumentError, "Unknown include filter: #{inspect(include)}"
      end
    end)
  end

  def preload_project_permissions(nil), do: nil
  def preload_project_permissions(check_in = %{project: %Ecto.Association.NotLoaded{}} = check_in), do: check_in
  def preload_project_permissions(check_in = %{project: project} = check_in) do
    %{check_in | project: Operately.Projects.Project.set_permissions(project, me(check_in))}
  end
end
