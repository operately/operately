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
  """
  def execute(person, args) do
    company_id = Map.get(args, :company_id)
    space_id = Map.get(args, :space_id)
    parent_goal_id = Map.get(args, :parent_goal_id)
    owner_id = Map.get(args, :owner_id)

    goals = get_goals_tree(person, company_id, space_id, parent_goal_id, owner_id)
    projects = get_projects(person, company_id, space_id, owner_id, parent_goal_id, goals)

    work_map = build_work_map(goals, projects)

    {:ok, work_map}
  end

  defp get_projects(person, company_id, space_id, owner_id, goal_id, goals) do
    goal_ids = Enum.map(goals, &(&1.id))

    from(Project, as: :projects)
    |> where([p], p.company_id == ^company_id)
    |> filter_by_space(space_id)
    |> filter_by_owner_project(owner_id)
    |> filter_by_goal(goal_id, goal_ids)
    |> join_preload_project_associations()
    |> filter_by_view_access(person, :projects)
    |> Repo.all()
  end

  defp get_goals_tree(person, company_id, space_id, parent_goal_id, owner_id) do
    initial_query =
      from(Goal, as: :goals)
      |> where([g], g.company_id == ^company_id)
      |> filter_by_space(space_id)
      |> filter_by_owner_goal(owner_id)
      |> filter_by_parent_goal(parent_goal_id)
      |> filter_by_view_access(person, :goals)

    recursive_query =
      from(Goal, as: :goals)
      |> join(:inner, [g], parent in "goal_tree", on: g.parent_goal_id == parent.id)
      |> where([g], g.company_id == ^company_id)
      |> filter_by_space(space_id)
      |> filter_by_owner_goal(owner_id)
      |> filter_by_view_access(person, :goals)

    goal_tree_query = union_all(initial_query, ^recursive_query)

    {"goal_tree", Goal}
    |> recursive_ctes(true)
    |> with_cte("goal_tree", as: ^goal_tree_query)
    |> select([g], g)
    |> join_preload_goal_associations()
    |> Repo.all()
  end

  defp build_work_map(goals, projects) do
    goals ++ projects
    |> Enum.map(fn item -> WorkMapItem.build_item(item, []) end)
    |> WorkMap.build_hierarchy()
  end

  #
  # Associations and Preloads
  #

  defp join_preload_goal_associations(query) do
    query
    |> join(:left, [g], c in assoc(g, :champion), as: :champion)
    |> join(:left, [g], gr in assoc(g, :group), as: :group)
    |> join(:left, [g], u in assoc(g, :last_update), as: :last_update)
    |> join(:left, [g], t in assoc(g, :targets), as: :targets)
    |> preload([champion: c, group: gr, last_update: u, targets: t],
      champion: c,
      group: gr,
      last_update: u,
      targets: t
    )
  end

  defp join_preload_project_associations(query) do
    query
    |> join(:left, [p], c in assoc(p, :champion), as: :champion)
    |> join(:left, [p], gr in assoc(p, :group), as: :group)
    |> join(:left, [p], m in assoc(p, :milestones), as: :milestones)
    |> join(:left, [p], lci in assoc(p, :last_check_in), as: :last_check_in)
    |> preload([champion: c, group: gr, milestones: m, last_check_in: lci],
      champion: c,
      group: gr,
      milestones: m,
      last_check_in: lci
    )
  end

  #
  # Filters
  #

  defp filter_by_parent_goal(query, nil) do
    where(query, [g], is_nil(g.parent_goal_id))
  end
  defp filter_by_parent_goal(query, parent_goal_id) do
    where(query, [g], g.parent_goal_id == ^parent_goal_id)
  end

  defp filter_by_goal(query, nil, goal_ids) do
    where(query, [p], is_nil(p.goal_id) or p.goal_id in ^goal_ids)
  end
  defp filter_by_goal(query, id, goal_ids) do
    where(query, [p], p.goal_id in ^[id | goal_ids])
  end

  defp filter_by_space(query, nil), do: query
  defp filter_by_space(query, space_id) do
    where(query, [item], item.group_id == ^space_id)
  end

  defp filter_by_owner_goal(query, nil), do: query
  defp filter_by_owner_goal(query, owner_id) do
    where(query, [g], g.champion_id == ^owner_id)
  end

  defp filter_by_owner_project(query, nil), do: query
  defp filter_by_owner_project(query, owner_id) do
    query
    |> join(:inner, [p], c in Operately.Projects.Contributor, on: c.project_id == p.id and c.role == :champion)
    |> where([_, c], c.person_id == ^owner_id)
  end

  defp filter_by_view_access(query, :system, _name), do: query
  defp filter_by_view_access(query, person = %Operately.People.Person{}, name) do
    Filters.filter_by_view_access(query, person.id, named_binding: name)
  end
end
