defmodule Operately.Projects.ListOperation do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Projects.Project

  def run(person, filters) do
    query = (from p in Project, as: :project)

    query = apply_visibility_filter(query, person)
    query = apply_group_filter(query, filters[:group_id])
    query = apply_goal_filter(query, filters[:goal_id])
    query = apply_company_filter(query, filters[:company_id])
    query = apply_only_my_projects_filter(query, person, filters)

    Repo.all(query, [with_deleted: filters[:include_archived]])
  end

  defp apply_visibility_filter(query, person) do
    from p in query,
      where: not(p.private) 
        or exists(
        from c in Operately.Projects.Contributor, 
          where: c.project_id == parent_as(:project).id and c.person_id == ^person.id
      )
  end


  defp apply_group_filter(query, nil), do: query
  defp apply_group_filter(query, group_id) do
    from p in query, where: p.group_id == ^group_id
  end

  defp apply_goal_filter(query, nil), do: query
  defp apply_goal_filter(query, goal_id) do
    from p in query, where: p.goal_id == ^goal_id
  end

  defp apply_company_filter(query, nil), do: query
  defp apply_company_filter(query, company_id) do
    from p in query, where: p.company_id == ^company_id
  end

  defp apply_only_my_projects_filter(query, person, filters) do
    if filters[:only_my_projects] do
      from p in query,
        where: exists(
          from c in Operately.Projects.Contributor, 
            where: c.project_id == parent_as(:project).id and c.person_id == ^person.id
        )
    else
      query
    end
  end

end
