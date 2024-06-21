defmodule OperatelyWeb.Api.Queries.GetProjects do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Serializer
  alias Operately.Projects.Project
  alias Operately.Projects.Contributor

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
    (from p in Project, as: :project, where: p.company_id == ^person.company_id)
    |> apply_visibility_filter(person)
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
    |> set_next_milestones(inputs[:include_milestones])
  end

  defp apply_visibility_filter(query, person) do
    from p in query, where: not(p.private) or exists(contributor_subquery(person))
  end
  
  defp apply_role_filter(query, person, inputs) do
    cond do
      inputs[:only_reviewed_by_me] ->
        from p in query, where: exists(contributor_subquery(person, [:reviewer]))
      inputs[:only_my_projects] ->
        from p in query, where: exists(contributor_subquery(person, [:champion, :contributor]))
      true ->
        query
    end
  end

  defp contributor_subquery(person) do
    from c in Contributor, where: c.project_id == parent_as(:project).id and c.person_id == ^person.id
  end

  defp contributor_subquery(person, roles) do
    from c in Contributor, where: c.project_id == parent_as(:project).id and c.person_id == ^person.id and c.role in ^roles
  end

  defp set_next_milestones(projects, true), do: Project.set_next_milestone(projects)
  defp set_next_milestones(projects, _), do: projects
end
