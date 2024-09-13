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

  def load(requester, id, inputs) do
    Projects.get(requester, id: id, opts: [
      preload: calc_preload(inputs),
      scopes: [Project.with_preloaded_access_levels(id)],
      after_load: [Project.set_permissions()],
      with_deleted: true
    ])

    # query
    # |> Project.after_load_hooks()
    # |> include_permissions(person, include_filters)
    # |> load_access_levels(inputs[:include_access_levels])
    # |> load_privacy(inputs[:include_privacy])
  end

  def calc_preload(inputs) do
    Enum.reduce(inputs, [], fn include, acc ->
      case include do
        :include_closed_by -> [:closed_by | acc]
        :include_contributors -> [[contributors: :person] | acc]
        :include_key_resources -> [[key_resources: :project] | acc]
        :include_last_check_in -> [[last_check_in: :author] | acc]
        :include_milestones -> [[milestones: :project] | acc]
        :include_goal -> [:goal | acc]
        :include_space -> [:group | acc]
        :include_champion -> [:champion | acc]
        :include_reviewer -> [:reviewer | acc]
        _ -> acc
      end
    end)
  end

  # def include_permissions(nil, _, _), do: nil
  # def include_permissions(project, person, include_filters) do
  #   if Enum.member?(include_filters, :include_permissions) do
  #     Project.set_permissions(project, person)
  #   else
  #     project
  #   end
  # end

  # defp load_contributors_access_level(query, true, project_id), do: Project.preload_contributors_access_level(query, project_id)
  # defp load_contributors_access_level(query, _, _), do: query

  # defp load_access_levels(nil, _), do: nil
  # defp load_access_levels(project, true), do: Project.preload_access_levels(project)
  # defp load_access_levels(project, _), do: project

  # defp load_privacy(nil, _), do: nil
  # defp load_privacy(project, true), do: Project.preload_privacy(project)
  # defp load_privacy(project, _), do: project
end
