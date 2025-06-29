defmodule OperatelyWeb.Api.Queries.GetProjects do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_view_access: 2]

  alias OperatelyWeb.Api.Serializer
  alias Operately.Projects.Project

  inputs do
    field? :only_my_projects, :boolean, null: true
    field? :only_reviewed_by_me, :boolean, null: true

    field? :space_id, :string, null: true
    field? :goal_id, :string, null: true

    field? :include_space, :boolean, null: true
    field? :include_milestones, :boolean, null: true
    field? :include_contributors, :boolean, null: true
    field? :include_last_check_in, :boolean, null: true
    field? :include_champion, :boolean, null: true
    field? :include_reviewer, :boolean, null: true
    field? :include_goal, :boolean, null: true
    field? :include_archived, :boolean, null: true
    field? :include_privacy, :boolean, null: true
    field? :include_retrospective, :boolean, null: true
  end

  outputs do
    field? :projects, list_of(:project), null: true
  end

  def call(conn, inputs) do
    projects = load(me(conn), inputs)
    output = %{projects: Serializer.serialize(projects, level: :full)}

    {:ok, output}
  end

  defp load(person, inputs) do
    {:ok, goal_id} = decode_id(inputs[:goal_id], :allow_nil)
    {:ok, space_id} = decode_id(inputs[:space_id], :allow_nil)

    include_filters = extract_include_filters(inputs)

    (from p in Project, as: :project)
    |> Project.scope_company(person.company_id)
    |> Project.scope_visibility(person.id)
    |> Project.scope_space(space_id)
    |> Project.scope_goal(goal_id)
    |> filter_by_view_access(person.id)
    |> apply_role_filter(person, inputs)
    |> include_requested(include_filters)
    |> Project.order_by_name()
    |> Repo.all(with_deleted: inputs[:include_archived] == true)
    |> Project.after_load_hooks()
    |> load_privacy(inputs[:include_privacy])
  end

  defp apply_role_filter(query, person, inputs) do
    cond do
      inputs[:only_reviewed_by_me] -> Project.scope_role(query, person.id, [:reviewer])
      inputs[:only_my_projects] -> Project.scope_role(query, person.id, [:champion, :contributor])
      true -> query
    end
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_closed_by -> from p in q, preload: [:closed_by]
        :include_goal -> from p in q, preload: [:goal]
        :include_space -> from p in q, preload: [:group]
        :include_contributors -> from p in q, preload: [contributors: :person]
        :include_last_check_in -> from p in q, preload: [last_check_in: :author]
        :include_key_resources -> from p in q, preload: [:key_resources]
        :include_champion -> from p in q, preload: [:champion]
        :include_reviewer -> from p in q, preload: [:reviewer]
        :include_milestones -> from p in q, preload: [milestones: :project]
        :include_retrospective -> from p in q, preload: [:retrospective]
        :include_privacy -> q
        _ -> q
      end
    end)
  end

  defp load_privacy(projects, true), do: Project.load_privacy(projects)
  defp load_privacy(projects, _), do: projects
end
