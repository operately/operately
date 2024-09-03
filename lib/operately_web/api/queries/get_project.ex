defmodule OperatelyWeb.Api.Queries.GetProject do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias Operately.Projects.Project
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :id, :string

    field :include_closed_by, :boolean
    field :include_contributors, :boolean
    field :include_goal, :boolean
    field :include_key_resources, :boolean
    field :include_last_check_in, :boolean
    field :include_milestones, :boolean
    field :include_permissions, :boolean
    field :include_champion, :boolean
    field :include_reviewer, :boolean
    field :include_space, :boolean
    field :include_contributors_access_levels, :boolean
    field :include_access_levels, :boolean
    field :include_privacy, :boolean
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    if inputs[:id] == nil do
      {:error, :bad_request}
    else
      {:ok, id} = decode_id(inputs[:id])

      project = load(me(conn), id, inputs)

      if nil == project do
        {:error, :not_found}
      else
        {:ok, %{project: Serializer.serialize(project, level: :full)}}
      end
    end
  end

  def load(person, id, inputs) do
    include_filters = extract_include_filters(inputs)
    query = from p in Project, as: :project, where: p.id == ^id

    query
    |> Project.scope_company(person.company_id)
    |> Project.scope_visibility(person.id)
    |> include_requested(include_filters)
    |> load_contributors_access_level(inputs[:include_contributors_access_levels], id)
    |> filter_by_view_access(person.id)
    |> Repo.one(with_deleted: true)
    |> Project.after_load_hooks()
    |> include_permissions(person, include_filters)
    |> load_access_levels(inputs[:include_access_levels])
    |> load_privacy(inputs[:include_privacy])
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_closed_by -> from p in q, preload: [:closed_by]
        :include_contributors -> from p in q, preload: [contributors: :person]
        :include_contributors_access_levels -> q # this is done in a separate function
        :include_key_resources -> from p in q, preload: [key_resources: :project]
        :include_last_check_in -> from p in q, preload: [last_check_in: :author]
        :include_milestones -> from p in q, preload: [milestones: :project]
        :include_goal -> from p in q, preload: [:goal]
        :include_space -> from p in q, preload: [:group]
        :include_champion -> from p in q, preload: [:champion]
        :include_reviewer -> from p in q, preload: [:reviewer]
        :include_permissions -> q # this is done after loading
        :include_access_levels -> q # this is done after loading
        :include_privacy -> q # this is done after the load
        _ -> raise ArgumentError, "Unknown include filter: #{inspect(include)}"
      end
    end)
  end

  def include_permissions(nil, _, _), do: nil
  def include_permissions(project, person, include_filters) do
    if Enum.member?(include_filters, :include_permissions) do
      Project.set_permissions(project, person)
    else
      project
    end
  end

  defp load_contributors_access_level(query, true, project_id), do: Project.preload_contributors_access_level(query, project_id)
  defp load_contributors_access_level(query, _, _), do: query

  defp load_access_levels(nil, _), do: nil
  defp load_access_levels(project, true), do: Project.preload_access_levels(project)
  defp load_access_levels(project, _), do: project

  defp load_privacy(nil, _), do: nil
  defp load_privacy(project, true), do: Project.preload_privacy(project)
  defp load_privacy(project, _), do: project
end
