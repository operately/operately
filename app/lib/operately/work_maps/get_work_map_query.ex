defmodule Operately.WorkMaps.GetWorkMapQuery do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.WorkMaps.WorkMapItem

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
    if parent_goal_id do
      get_goal_children_work_map(company_id, space_id, parent_goal_id, owner_id)
    else
      goals_hierarchy = get_goals_tree(company_id, space_id, nil, owner_id)
      root_projects = get_root_projects(company_id, space_id, owner_id)

      build_work_map_tree(goals_hierarchy, root_projects)
    end
  end

  defp get_goal_children_work_map(company_id, space_id, parent_goal_id, owner_id) do
    goals_subtree = get_goals_tree(company_id, space_id, parent_goal_id, owner_id)
    direct_children = Enum.filter(goals_subtree, fn goal ->
      goal.parent_goal_id == parent_goal_id &&
      (space_id == nil || goal.group_id == space_id)
    end)

    parent_projects = get_root_projects(company_id, space_id, owner_id, parent_goal_id)

    build_subtree(direct_children, goals_subtree, parent_projects)
  end

  defp get_root_projects(company_id, space_id, owner_id, goal_id \\ nil) do
    Project
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

  #
  # Build Work Map
  #

  defp build_work_map_tree(goals, root_projects) do
    goal_children_map = Enum.reduce(goals, %{}, fn goal, acc ->
      parent_id = goal.parent_goal_id

      if is_nil(parent_id) do
        acc
      else
        children = Map.get(acc, parent_id, [])
        Map.put(acc, parent_id, [goal | children])
      end
    end)

    root_goals = Enum.filter(goals, fn goal -> is_nil(goal.parent_goal_id) end)

    root_goal_nodes = build_goal_nodes(root_goals, goal_children_map)

    root_project_nodes = Enum.map(root_projects, fn project ->
      %{item: project, type: :project, children: []}
    end)

    root_goal_nodes ++ root_project_nodes
  end

  defp build_goal_nodes(goals, goal_children_map) do
    Enum.map(goals, fn goal ->
      child_goals = Map.get(goal_children_map, goal.id, [])
      child_projects = goal.projects || []

      child_goal_nodes = build_goal_nodes(child_goals, goal_children_map)

      child_project_nodes = Enum.map(child_projects, fn project ->
        %{item: project, type: :project, children: []}
      end)

      children = child_goal_nodes ++ child_project_nodes

      %{item: goal, type: :goal, children: children}
    end)
  end

  defp build_subtree(goals, all_goals, parent_projects) do
    Enum.map(goals, fn goal ->
      children_goals = Enum.filter(all_goals, fn g -> g.parent_goal_id == goal.id end)
      goal_projects = goal.projects || []

      children_nodes = build_subtree(children_goals, all_goals, [])

      project_nodes = Enum.map(goal_projects, fn project ->
        WorkMapItem.build_item(project, [])
      end)

      WorkMapItem.build_item(goal, children_nodes ++ project_nodes)
    end) ++
    if Enum.empty?(goals) do
      []
    else
      Enum.map(parent_projects, fn project ->
        WorkMapItem.build_item(project, [])
      end)
    end
  end

  #
  # Associations and Preloads
  #

  defp join_preload_goal_associations(query) do
    query
    |> join(:left, [g], c in assoc(g, :champion), as: :champion)
    |> join(:left, [g], r in assoc(g, :reviewer), as: :reviewer)
    |> join(:left, [g], gr in assoc(g, :group), as: :group)
    |> join(:left, [g], u in assoc(g, :last_update), as: :last_update)
    |> join(:left, [g], p in assoc(g, :projects), as: :projects)
    |> preload([champion: c, reviewer: r, group: gr, last_update: u, projects: p],
      champion: c,
      reviewer: r,
      group: gr,
      last_update: u,
      projects: {p, [:champion, :reviewer, :group, :milestones]}
    )
  end

  defp join_preload_project_associations(query) do
    query
    |> join(:left, [p], c in assoc(p, :champion), as: :champion)
    |> join(:left, [p], r in assoc(p, :reviewer), as: :reviewer)
    |> join(:left, [p], gr in assoc(p, :group), as: :group)
    |> join(:left, [p], m in assoc(p, :milestones), as: :milestones)
    |> preload([champion: c, reviewer: r, group: gr, milestones: m],
      champion: c,
      reviewer: r,
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
