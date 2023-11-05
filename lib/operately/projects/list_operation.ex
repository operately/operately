defmodule Operately.Projects.ListOperation do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Operately.Projects.Project

  def run(person, filters) do
    query = from p in Project

    query = apply_visibility_filter(query, person)
    query = apply_group_filter(query, filters[:group_id], filters[:group_member_roles])
    query = apply_objective_filter(query, filters[:objective_id])

    Repo.all(query, [with_deleted: filters[:include_archived]])
  end

  defp apply_visibility_filter(query, person) do
    from p in query,
      as: :project,
      where: not(p.private) 
        or exists(
        from c in Operately.Projects.Contributor, 
          where: c.project_id == parent_as(:project).id and c.person_id == ^person.id
      )
  end

  #
  # Filter by group if the filter is present
  #
  defp apply_group_filter(query, nil, _) do
    query
  end

  defp apply_group_filter(query, group_id, group_member_roles) do
    from p in query,
      join: c in assoc(p, :contributors),
      join: m in Operately.Groups.Member, on: m.person_id == c.person_id,
      join: g in Operately.Groups.Group, on: m.group_id == g.id,
      where: g.id == ^group_id,
      where: c.role in ^group_member_roles
  end

  #
  # Filter by objective if the filter is present
  #
  defp apply_objective_filter(query, nil) do
    query
  end

  defp apply_objective_filter(query, objective_id) do
    from p in query, where: p.objective_id == ^objective_id
  end

end
