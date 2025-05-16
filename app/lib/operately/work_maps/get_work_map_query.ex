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

    goals_task = Task.async(fn -> get_goals_tree(person, company_id, include_assignees) end)
    projects_task = Task.async(fn -> get_projects(person, company_id, include_assignees) end)

    goals = Task.await(goals_task)
    projects = Task.await(projects_task)

    work_map = build_work_map(goals, projects, args)

    {:ok, work_map}
  end

  defp get_projects(person, company_id, include_assignees) do
    from(Project, as: :projects)
    |> where([p], p.company_id == ^company_id)
    |> join_preload_project_associations(include_assignees)
    |> filter_by_view_access(person, :projects)
    |> load_access_levels()
    |> Repo.all()
  end

  defp get_goals_tree(person, company_id, include_assignees) do
    from(Goal, as: :goals)
    |> where([g], g.company_id == ^company_id)
    |> join_preload_goal_associations(include_assignees)
    |> filter_by_view_access(person, :goals)
    |> load_access_levels()
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
  # Associations and Preloads
  #

  defp join_preload_goal_associations(query, include_assignees) do
    query
    |> join(:left, [g], company in assoc(g, :company), as: :company)
    |> join(:left, [g], c in assoc(g, :champion), as: :champion)
    |> join(:left, [g], gr in assoc(g, :group), as: :group)
    |> join(:left, [g], t in assoc(g, :targets), as: :targets)
    |> preload([company: company, champion: c, group: gr, targets: t],
      company: company,
      champion: c,
      group: gr,
      targets: t
    )
    |> maybe_preload_goal_assignees(include_assignees)
  end

  defp join_preload_project_associations(query, include_assignees) do
    query
    |> join(:left, [p], company in assoc(p, :company), as: :company)
    |> join(:left, [p], c in assoc(p, :champion), as: :champion)
    |> join(:left, [p], gr in assoc(p, :group), as: :group)
    |> join(:left, [p], m in assoc(p, :milestones), as: :milestones)
    |> join(:left, [p], lci in assoc(p, :last_check_in), as: :last_check_in)
    |> preload([company: company, champion: c, group: gr, milestones: m, last_check_in: lci],
      company: company,
      champion: c,
      group: gr,
      milestones: m,
      last_check_in: lci
    )
    |> maybe_preload_project_assignees(include_assignees)
  end

  #
  # Assignees
  #

  defp maybe_preload_goal_assignees(query, true) do
    query
    |> join(:left, [g], r in assoc(g, :reviewer), as: :reviewer)
    |> preload([reviewer: r], reviewer: r)
  end
  defp maybe_preload_goal_assignees(query, _), do: query

  defp maybe_preload_project_assignees(query, true) do
    query
    |> join(:left, [p], a in assoc(p, :contributing_people), as: :contributing_people)
    |> preload([contributing_people: a], contributing_people: a)
  end
  defp maybe_preload_project_assignees(query, _), do: query

  #
  # Access
  #

  defp load_access_levels(query) do
    # If the `context` association is not established by filter_by_view_access/3,
    # it will be established by maybe_join_context/1.
    query
    |> maybe_join_context()
    |> join(:left, [context: c], b in assoc(c, :bindings), as: :bindings)
    |> join(:left, [bindings: b], g in assoc(b, :group), as: :access_group)
    |> preload([bindings: b, context: c, access_group: g],
      access_context: {c, [bindings: {b, group: g}]}
    )
  end

  defp maybe_join_context(q) when is_named_binding(q, :context), do: q
  defp maybe_join_context(q), do: join(q, :left, [r], c in assoc(r, :access_context), as: :context)

  defp filter_by_view_access(query, :system, _name), do: query

  defp filter_by_view_access(query, person = %Operately.People.Person{}, name) do
    Filters.filter_by_view_access(query, person.id, named_binding: name)
  end
end
