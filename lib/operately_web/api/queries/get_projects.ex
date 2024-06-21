defmodule OperatelyWeb.Api.Queries.GetProjects do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Serializer
  alias Operately.Projects.Project

  inputs do
    field :only_my_projects, :boolean
    field :only_reviewed_by_me, :boolean

    field :space_id, :string
    field :goal_id, :string

    field :include_space, :boolean
    field :include_milestones, :boolean
    field :include_contributors, :boolean
    field :include_last_check_in, :boolean
    field :include_champion, :boolean
    field :include_goal, :boolean
    field :include_archived, :boolean
  end

  outputs do
    field :projects, list_of(:project)
  end

  def call(conn, inputs) do
    projects = load(me(conn), inputs)
    output = %{projects: Serializer.serialize(projects, level: :full)}

    {:ok, output}
  end

  defp load(person, inputs) do
    include_filters = extract_include_filters(inputs)

    (from p in Project, as: :project)
    |> Project.scope_company(person.company_id)
    |> Project.scope_visibility(person.id)
    |> Project.scope_space(inputs[:space_id])
    |> Project.scope_goal(inputs[:goal_id])
    |> apply_role_filter(person, inputs)
    |> include_requested(include_filters)
    |> Repo.all()
    |> Project.after_load_hooks()
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
        :include_archived -> from p in q, where: is_nil(p.deleted_at)
        :include_milestones -> from p in q, preload: [:milestones]
        _ -> q 
      end
    end)
  end
end
