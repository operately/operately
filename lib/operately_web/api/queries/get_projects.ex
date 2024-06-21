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
    (from p in Project, as: :project)
    |> Project.scope_company(person.company_id)
    |> Project.scope_visibility(person.id)
    |> apply_role_filter(person, inputs)
    |> extend_query(inputs[:space_id], fn q -> from p in q, where: p.group_id == ^inputs.space_id end)
    |> extend_query(inputs[:goal_id], fn q -> from p in q, where: p.goal_id == ^inputs.goal_id end)
    |> extend_query(inputs[:include_space], fn q -> from p in q, preload: [:group] end)
    |> extend_query(inputs[:include_contributors], fn q -> from p in q, preload: [contributors: :person] end)
    |> extend_query(inputs[:include_last_check_in], fn q -> from p in q, preload: [last_check_in: :author] end)
    |> extend_query(inputs[:include_champion], fn q -> from p in q, preload: [:champion] end)
    |> extend_query(inputs[:include_goal], fn q -> from p in q, preload: [:goal] end)
    |> extend_query(inputs[:include_archived], fn q -> from p in q, where: is_nil(p.deleted_at) end)
    |> extend_query(inputs[:include_milestones], fn q -> from p in q, preload: [:milestones] end)
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
end
