defmodule Operately.WorkMaps.GetWorkMapQuery do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.WorkMaps.{WorkMap, WorkMapItem}
  alias Operately.Access.Filters

  @doc """
  Retrieves a work map based on the provided parameters.

  Parameters:
  - person: The person making the request. Only resources to which
    the person has permissions are returned. If the atom :system is
    provided, the permissions check is not made
  - args: A map containing the following parameters:
    - company_id (required): The ID of the company
    - space_id (optional): The ID of the space/group
    - parent_goal_id (optional): The ID of the parent goal
    - owner_id (optional): The ID of the owner/champion
    - include_assignees (optional): A boolean indicating whether to include assignees in the result. Defaults to false
  """
  def execute(person, args) do
    company_id = Map.get(args, :company_id)
    include_assignees = Map.get(args, :include_assignees, false)

    goals_task = Task.async(fn -> get_goals(person, company_id, include_assignees) end)
    projects_task = Task.async(fn -> get_projects(person, company_id, include_assignees) end)

    goals = Task.await(goals_task)
    projects = Task.await(projects_task)

    work_map = build_work_map(goals, projects, args)

    {:ok, work_map}
  end

  defp get_projects(person, company_id, include_assignees) do
    project_ids =
      from(Project, as: :projects)
      |> where([p], p.company_id == ^company_id)
      |> filter_by_view_access(person, :projects)
      |> select([projects: p], p.id)
      |> Repo.all()

    from(p in Project, where: p.id in ^project_ids)
    |> preload_project_associations(include_assignees)
    |> Repo.all()
  end

  defp get_goals(person, company_id, include_assignees) do
    goal_ids =
      from(Goal, as: :goal)
      |> where([g], g.company_id == ^company_id)
      |> filter_by_view_access(person, :goal)
      |> select([goal: g], g.id)
      |> Repo.all()

    from(g in Goal, as: :goal, where: g.id in ^goal_ids)
    |> preload_goal_associations(include_assignees)
    |> Repo.all()
  end

  defp build_work_map(goals, projects, args) do
    include_assignees = Map.get(args, :include_assignees, false)
    filters = Map.take(args, [:space_id, :parent_goal_id, :owner_id])

    (goals ++ projects)
    |> Enum.map(fn item -> WorkMapItem.build_item(item, [], include_assignees) end)
    |> WorkMap.filter_flat_list(filters)
    |> WorkMap.build_hierarchy()
  end

  #
  # Preloads
  #

  defp preload_project_associations(query, include_assignees) do
    query
    |> join(:left, [p], company in assoc(p, :company), as: :company)
    |> join(:left, [p], c in assoc(p, :champion), as: :champion)
    |> join(:left, [p], gr in assoc(p, :group), as: :group)
    |> join(:left, [p], lci in assoc(p, :last_check_in), as: :last_check_in)
    |> preload([company: company, champion: c, group: gr, last_check_in: lci], [
      company: company,
      champion: c,
      group: gr,
      last_check_in: lci
    ])
    |> preload_project_milestones()
    |> preload_access_levels()
    |> maybe_preload_project_contributor(include_assignees)
  end

  defp preload_project_milestones(query) do
    subquery = from(m in Operately.Projects.Milestone,
      where: m.status == :pending,
      select: %{id: m.id, title: m.title, status: m.status, deadline_at: m.deadline_at}
    )

    preload(query, [], milestones: ^subquery)
  end

  defp preload_goal_associations(query, include_assignees) do
    query
    |> join(:left, [goal: g], company in assoc(g, :company), as: :company)
    |> join(:left, [goal: g], c in assoc(g, :champion), as: :champion)
    |> join(:left, [goal: g], gr in assoc(g, :group), as: :group)
    |> preload([company: company, champion: c, group: gr], [
      :targets,
      company: company,
      champion: c,
      group: gr
    ])
    |> preload_access_levels()
    |> maybe_preload_goal_reviewer(include_assignees)
  end

  #
  # Assignees
  #

  defp maybe_preload_project_contributor(query, true), do: preload(query, [], :contributing_people)
  defp maybe_preload_project_contributor(query, _), do: query

  defp maybe_preload_goal_reviewer(query, true) do
    query
    |> join(:left, [goal: g], r in assoc(g, :reviewer), as: :reviewer)
    |> preload([reviewer: r], reviewer: r)
  end
  defp maybe_preload_goal_reviewer(query, _), do: query

  #
  # Access
  #

  defp preload_access_levels(query) do
    subquery = from(c in Operately.Access.Context,
      join: b in assoc(c, :bindings),
      join: g in assoc(b, :group),
      preload: [bindings: {b, group: g}]
    )

    preload(query, [], access_context: ^subquery)
  end

  defp filter_by_view_access(query, :system, _name), do: query

  defp filter_by_view_access(query, person = %Operately.People.Person{}, name) do
    Filters.filter_by_view_access(query, person.id, named_binding: name)
  end
end
