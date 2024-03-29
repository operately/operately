defmodule Operately.Projects.ListOperation do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Projects.Project

  def run(person, filters) do
    query = (from p in Project, as: :project)

    query = apply_visibility_filter(query, person)
    query = apply_group_filter(query, filters[:space_id])
    query = apply_goal_filter(query, filters[:goal_id])
    query = apply_company_filter(query, filters[:company_id])
    query = apply_role_filter(query, person, filters[:filter])

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
  defp apply_group_filter(query, space_id) do
    from p in query, where: p.group_id == ^space_id
  end

  defp apply_goal_filter(query, nil), do: query
  defp apply_goal_filter(query, goal_id) do
    from p in query, where: p.goal_id == ^goal_id
  end

  defp apply_company_filter(query, nil), do: query
  defp apply_company_filter(query, company_id) do
    from p in query, where: p.company_id == ^company_id
  end

  defp apply_role_filter(query, person, filter) do
    alias Operately.Projects.Contributor

    cond do
      filter == "my-projects" ->
        from p in query, where: exists(from c in Contributor, where: c.project_id == parent_as(:project).id and c.person_id == ^person.id and c.role in [:champion, :contributor])
      filter == "reviewed-by-me" ->
        from p in query, where: exists(from c in Contributor, where: c.project_id == parent_as(:project).id and c.person_id == ^person.id and c.role in [:reviewer])
      filter == "all-projecs" ->
        query
      true ->
        query
    end
  end

end
