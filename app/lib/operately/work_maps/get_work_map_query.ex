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
      goals_hierarchy = get_goals_hierarchy(company_id, space_id, nil, owner_id)
      goal_ids = Enum.map(goals_hierarchy, & &1.id)
      projects = get_all_projects(company_id, space_id, goal_ids, owner_id)

      build_work_map_tree(goals_hierarchy, projects)
    end
  end

  defp get_goal_children_work_map(company_id, space_id, parent_goal_id, owner_id) do
    goals_subtree = get_goals_subtree(company_id, space_id, parent_goal_id, owner_id)
    direct_children = Enum.filter(goals_subtree, fn goal ->
      goal.parent_goal_id == parent_goal_id &&
      (space_id == nil || goal.group_id == space_id)
    end)

    goal_ids = Enum.map(goals_subtree, & &1.id)
    all_projects = get_all_subtree_projects(company_id, space_id, goal_ids, parent_goal_id, owner_id)

    build_subtree(direct_children, goals_subtree, all_projects)
  end

  defp get_all_subtree_projects(company_id, space_id, goal_ids, parent_goal_id, owner_id) do
    parent_projects =
      Project
      |> where([p], p.company_id == ^company_id)
      |> where([p], p.goal_id == ^parent_goal_id)
      |> filter_by_space(space_id)
      |> filter_by_owner_project(owner_id)
      |> join_preload_project_associations()
      |> Repo.all()
      |> Enum.map(fn project -> {parent_goal_id, project} end)

    child_projects =
      if Enum.empty?(goal_ids) do
        []
      else
        Project
        |> where([p], p.company_id == ^company_id)
        |> where([p], p.goal_id in ^goal_ids)
        |> filter_by_space(space_id)
        |> filter_by_owner_project(owner_id)
        |> join_preload_project_associations()
        |> Repo.all()
        |> Enum.map(fn project -> {project.goal_id, project} end)
      end

    (parent_projects ++ child_projects)
    |> Enum.group_by(fn {goal_id, _} -> goal_id end, fn {_, project} -> project end)
  end

  defp get_goals_subtree(company_id, space_id, parent_goal_id, owner_id) do
    initial_query =
      Goal
      |> where([g], g.company_id == ^company_id)
      |> where([g], g.parent_goal_id == ^parent_goal_id)
      |> filter_by_space(space_id)
      |> filter_by_owner_goal(owner_id)

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
    |> join_preload_goal_associations()
    |> select([g], g)
    |> Repo.all()
  end

  defp get_all_projects(company_id, space_id, goal_ids, owner_id) do
    goal_projects = get_projects(company_id, space_id, goal_ids, owner_id)

    root_projects =
      Project
      |> where([p], p.company_id == ^company_id)
      |> where([p], is_nil(p.goal_id))
      |> filter_by_space(space_id)
      |> filter_by_owner_project(owner_id)
      |> join_preload_project_associations()
      |> Repo.all()
      |> Enum.map(fn project ->
        %{project: project, goal_id: nil}
      end)

    goal_projects ++ root_projects
  end

  defp get_projects(company_id, space_id, goal_ids, owner_id) do
    goal_projects =
      Project
      |> where([p], p.company_id == ^company_id)
      |> where([p], p.goal_id in ^goal_ids)
      |> filter_by_space(space_id)
      |> filter_by_owner_project(owner_id)
      |> join_preload_project_associations()
      |> Repo.all()

    Enum.map(goal_projects, fn project ->
      %{project: project, goal_id: project.goal_id}
    end)
  end

  defp build_work_map_tree(goals, projects) do
    goal_children_map = Enum.reduce(goals, %{}, fn goal, acc ->
      parent_id = goal.parent_goal_id

      if is_nil(parent_id) do
        acc
      else
        children = Map.get(acc, parent_id, [])
        Map.put(acc, parent_id, [goal | children])
      end
    end)

    project_children_map = Enum.reduce(projects, %{}, fn %{project: project, goal_id: goal_id}, acc ->
      if is_nil(goal_id) do
        acc
      else
        children = Map.get(acc, goal_id, [])
        Map.put(acc, goal_id, [project | children])
      end
    end)

    root_goals = Enum.filter(goals, fn goal -> is_nil(goal.parent_goal_id) end)
    root_projects = Enum.filter(projects, fn %{project: _project, goal_id: goal_id} -> is_nil(goal_id) end)

    root_goal_nodes = build_goal_nodes(root_goals, goal_children_map, project_children_map)

    root_project_nodes = Enum.map(root_projects, fn %{project: project} ->
      %{item: project, type: :project, children: []}
    end)

    root_goal_nodes ++ root_project_nodes
  end

  defp build_goal_nodes(goals, goal_children_map, project_children_map) do
    Enum.map(goals, fn goal ->
      child_goals = Map.get(goal_children_map, goal.id, [])
      child_projects = Map.get(project_children_map, goal.id, [])

      child_goal_nodes = build_goal_nodes(child_goals, goal_children_map, project_children_map)

      child_project_nodes = Enum.map(child_projects, fn project ->
        %{item: project, type: :project, children: []}
      end)

      children = child_goal_nodes ++ child_project_nodes

      %{item: goal, type: :goal, children: children}
    end)
  end

  defp build_subtree(goals, all_goals, projects_by_goal) do
    Enum.map(goals, fn goal ->
      children_goals = Enum.filter(all_goals, fn g -> g.parent_goal_id == goal.id end)
      goal_projects = Map.get(projects_by_goal, goal.id, [])

      children_nodes = build_subtree(children_goals, all_goals, projects_by_goal)

      project_nodes = Enum.map(goal_projects, fn project ->
        WorkMapItem.build_item(project, [])
      end)

      WorkMapItem.build_item(goal, children_nodes ++ project_nodes)
    end) ++
    if Enum.empty?(goals) do
      []
    else
      parent_id = hd(goals).parent_goal_id
      parent_projects = Map.get(projects_by_goal, parent_id, [])
      Enum.map(parent_projects, fn project ->
        WorkMapItem.build_item(project, [])
      end)
    end
  end

  defp get_goals_hierarchy(company_id, space_id, parent_goal_id, owner_id) do
    initial_query =
      Goal
      |> where([g], g.company_id == ^company_id)
      |> filter_by_parent_goal(parent_goal_id)
      |> filter_by_space(space_id)
      |> filter_by_owner_goal(owner_id)

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

  defp filter_by_parent_goal(query, nil) do
    where(query, [g], is_nil(g.parent_goal_id))
  end
  defp filter_by_parent_goal(query, parent_goal_id) do
    where(query, [g], g.parent_goal_id == ^parent_goal_id)
  end

  defp filter_by_space(query, nil), do: query
  defp filter_by_space(query, space_id) do
    where(query, [item], item.group_id == ^space_id)
  end

  defp join_preload_goal_associations(query) do
    query
    |> join(:left, [g], c in assoc(g, :champion), as: :champion)
    |> join(:left, [g], r in assoc(g, :reviewer), as: :reviewer)
    |> join(:left, [g], gr in assoc(g, :group), as: :group)
    |> join(:left, [g], u in assoc(g, :last_update), as: :last_update)
    |> preload([champion: c, reviewer: r, group: gr, last_update: u],
      champion: c,
      reviewer: r,
      group: gr,
      last_update: u
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
