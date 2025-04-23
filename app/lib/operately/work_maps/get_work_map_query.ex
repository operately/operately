defmodule Operately.WorkMaps.GetWorkMapQuery do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.WorkMaps.WorkMapItem
  alias Operately.WorkMaps.WorkMap

  @doc """
  Retrieves a work map based on the provided parameters.

  Parameters:
  - company_id (required): The ID of the company
  - space_id (optional): The ID of the space/group
  - parent_goal_id (optional): The ID of the parent goal
  - owner_id (optional): The ID of the owner/champion
  """
  def execute(args) do
    company_id = Map.get(args, :company_id)
    space_id = Map.get(args, :space_id)
    parent_goal_id = Map.get(args, :parent_goal_id)
    owner_id = Map.get(args, :owner_id)

    work_map = get_work_map(company_id, space_id, parent_goal_id, owner_id)

    {:ok, work_map}
  end

  defp get_work_map(company_id, space_id, parent_goal_id, owner_id) do
    goals = get_goals_tree(company_id, space_id, parent_goal_id, owner_id)
    root_projects = get_root_projects(company_id, space_id, owner_id, parent_goal_id)

    build_work_map(goals, root_projects)
  end

  defp get_root_projects(company_id, space_id, owner_id, goal_id) do
    from(Project, as: :projects)
    |> where([p], p.company_id == ^company_id)
    |> filter_by_space(space_id)
    |> filter_by_owner_project(owner_id)
    |> filter_by_goal(goal_id)
    |> join_preload_project_associations()
    |> Repo.all()
  end

  defp get_goals_tree(company_id, space_id, parent_goal_id, owner_id) do
    initial_query =
      Goal
      |> where([g], g.company_id == ^company_id)
      |> filter_by_space(space_id)
      |> filter_by_owner_goal(owner_id)
      |> filter_by_parent_goal(parent_goal_id)

    recursive_query =
      Goal
      |> join(:inner, [g], parent in "goal_tree", on: g.parent_goal_id == parent.id)
      |> where([g], g.company_id == ^company_id)
      |> filter_by_space(space_id)
      |> filter_by_owner_goal(owner_id)

    goal_tree_query = union_all(initial_query, ^recursive_query)

    {"goal_tree", Goal}
    |> recursive_ctes(true)
    |> with_cte("goal_tree", as: ^goal_tree_query)
    |> select([g], g)
    |> join_preload_goal_associations()
    |> Repo.all()
  end

  defp build_work_map(goals, projects) do
    Enum.map(goals, fn goal -> [goal, goal.projects] end)
    |> Enum.concat(projects)
    |> List.flatten()
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
    |> join(:left, [g], p in assoc(g, :projects), as: :projects)
    |> preload([champion: c, group: gr, last_update: u, projects: p],
      champion: c,
      group: gr,
      last_update: u
    )
    |> join(:left, [projects: p], pc in assoc(p, :champion), as: :p_champion)
    |> join(:left, [projects: p], pg in assoc(p, :group), as: :p_group)
    |> join(:left, [projects: p], pm in assoc(p, :milestones), as: :p_milestones)
    |> preload([projects: p, p_champion: pc, p_group: pg, p_milestones: pm],
      projects: {p, [champion: pc, group: pg, milestones: pm]}
    )
  end

  defp join_preload_project_associations(query) do
    query
    |> join(:left, [p], c in assoc(p, :champion), as: :champion)
    |> join(:left, [p], gr in assoc(p, :group), as: :group)
    |> join(:left, [p], m in assoc(p, :milestones), as: :milestones)
    |> preload([champion: c, group: gr, milestones: m],
      champion: c,
      group: gr,
      milestones: m
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

  defp filter_by_goal(query, nil) do
    where(query, [p], is_nil(p.goal_id))
  end
  defp filter_by_goal(query, goal_id) do
    where(query, [p], p.goal_id == ^goal_id)
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
end
