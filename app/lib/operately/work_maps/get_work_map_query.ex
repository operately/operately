defmodule Operately.WorkMaps.GetWorkMapQuery do
  import Ecto.Query

  require Logger

  alias Operately.Repo
  alias Operately.Goals.Goal
  alias Operately.Projects.Project
  alias Operately.Groups.Group
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
    - champion_id (optional): The ID of the champion
    - reviewer_id (optional): The ID of the reviewer
    - contributor_id (optional): The ID of a contributor
    - include_assignees (optional): A boolean indicating whether to include assignees in the result. Defaults to false
    - include_reviewer (optional): A boolean indicating whether to include reviewer details in the result. Defaults to false
    - only_completed (optional): A boolean indicating whether to return only completed items. Defaults to false
  """
  def execute(person, args) do
    try do
      goals_task = Task.async(fn -> get_goals(person, args) end)
      projects_task = Task.async(fn -> get_projects(person, args) end)

      goals = Task.await(goals_task)
      projects = Task.await(projects_task)

      work_map = build_work_map(goals, projects, args)

      {:ok, work_map}
    rescue
      e in Ecto.Query.CastError ->
        Logger.error("WorkMap query cast error: #{inspect(e)} - args: #{inspect(args)}")
        {:error, :invalid_parameters}

      e in ArgumentError ->
        Logger.error("WorkMap query argument error: #{inspect(e)} - args: #{inspect(args)}")
        {:error, :invalid_arguments}

      e ->
        Logger.error("WorkMap query failed: #{inspect(e)} - args: #{inspect(args)}")
        {:error, :query_failed}
    end
  end

  @doc """
  Similar to execute/2 but returns a flat list of work map items instead of a hierarchical structure.
  This provides the same filtering capabilities as execute/2 but skips the hierarchy building.

  Unlike the hierarchical version, this implementation only returns items that directly match
  the filter criteria without preserving parent-child relationships in the results.
  Parent IDs are still included in each item, but parent items themselves are not included unless
  they match the filter criteria directly.
  """
  def execute(person, args, :flat) do
    try do
      goals_task = Task.async(fn -> get_goals(person, args) end)
      projects_task = Task.async(fn -> get_projects(person, args) end)
      tasks_task = Task.async(fn -> get_tasks(person, args) end)

      goals = Task.await(goals_task)
      projects = Task.await(projects_task)
      tasks = Task.await(tasks_task)

      flat_items = build_flat_work_map(goals, projects, tasks, args)

      {:ok, flat_items}
    rescue
      e in Ecto.Query.CastError ->
        Logger.error("WorkMap flat query cast error: #{inspect(e)} - args: #{inspect(args)}")
        {:error, :invalid_parameters}

      e in ArgumentError ->
        Logger.error("WorkMap flat query argument error: #{inspect(e)} - args: #{inspect(args)}")
        {:error, :invalid_arguments}

      e ->
        Logger.error("WorkMap flat query failed: #{inspect(e)} - args: #{inspect(args)}")
        {:error, :query_failed}
    end
  end

  defp build_flat_work_map(goals, projects, tasks, args) do
    filters = extract_filters(args)
    contributor_id = Map.get(filters, :contributor_id)

    items =
      (goals ++ projects ++ tasks)
      |> Enum.map(fn item ->
        item
        |> WorkMapItem.build_item([], include_assignees?(args) || needs_contributor?(args))
        |> maybe_add_contributor(contributor_id)
      end)

    WorkMap.filter_direct_matches(items, filters)
  end

  defp get_projects(person, args) do
    company_id = args.company_id

    if is_nil(company_id) do
      Logger.warning("WorkMap get_projects called with nil company_id")
      []
    else
      project_ids =
        from(Project, as: :projects)
        |> where([p], p.company_id == ^company_id)
        |> filter_by_view_access(person, :projects)
        |> select([projects: p], p.id)
        |> Repo.all()

      from(p in Project, where: p.id in ^project_ids)
      |> preload_project_associations(args, person)
      |> Repo.all()
    end
  end

  defp get_goals(person, args) do
    company_id = args.company_id

    if is_nil(company_id) do
      Logger.warning("WorkMap get_goals called with nil company_id")
      []
    else
      goal_ids =
        from(Goal, as: :goal)
        |> where([g], g.company_id == ^company_id)
        |> filter_by_view_access(person, :goal)
        |> select([goal: g], g.id)
        |> Repo.all()

      from(g in Goal, as: :goal, where: g.id in ^goal_ids)
      |> preload_goal_associations(args, person)
      |> Repo.all()
    end
  end

  defp get_tasks(person, args) do
    include_tasks = include_tasks?(args)
    company_id = args.company_id

    cond do
      not include_tasks ->
        []

      is_nil(company_id) ->
        Logger.warning("WorkMap get_tasks called with nil company_id")
        []

      match?(:system, person) ->
        []

      match?(%Operately.People.Person{}, person) ->
        from(t in Operately.Tasks.Task, as: :task)
        |> join(:inner, [task: t], a in assoc(t, :assignees), as: :assignee)
        |> join(:left, [task: t], p in assoc(t, :project), as: :project)
        |> where([assignee: a], a.person_id == ^person.id)
        |> Operately.Tasks.Task.scope_company(company_id)
        |> where([project: p], is_nil(p.id) or p.status == "active")
        |> where([task: t], fragment("COALESCE((?->>'closed')::boolean, false) = false", t.task_status))
        |> preload([:project, :space, :project_space, :company, :assigned_people])
        |> Repo.all()

      true ->
        Logger.warning("Invalid person for tasks query: #{inspect(person)}")
        []
    end
  end

  defp build_work_map(goals, projects, args) do
    filters = extract_filters(args)
    contributor_id = Map.get(filters, :contributor_id)

    items =
      (goals ++ projects)
      |> Enum.map(fn item ->
        item
        |> WorkMapItem.build_item([], include_assignees?(args) || needs_contributor?(args))
        |> maybe_add_contributor(contributor_id)
      end)

    items
    |> WorkMap.filter_flat_list(filters)
    |> WorkMap.build_hierarchy()
  end

  defp maybe_add_contributor(item = %{type: :project, assignees: assignees}, contributor_id) when not is_nil(contributor_id) and not is_nil(assignees) do
    contributor = Enum.find(assignees, fn person -> person && person.id == contributor_id end)

    Map.put(item, :contributor, contributor)
  end

  defp maybe_add_contributor(item, _), do: item

  #
  # Filter helpers
  #

  defp include_assignees?(args), do: Map.get(args, :include_assignees, false)

  defp include_tasks?(args), do: Map.get(args, :include_tasks, false)

  defp include_reviewer?(args), do: Map.get(args, :include_reviewer, false)

  defp needs_reviewer?(args), do: Map.get(args, :reviewer_id) != nil

  defp needs_contributor?(args), do: Map.get(args, :contributor_id) != nil

  defp extract_filters(args) do
    Map.take(args, [:space_id, :parent_goal_id, :champion_id, :reviewer_id, :contributor_id, :only_completed])
  end

  #
  # Preloads
  #

  defp preload_project_associations(query, args, person) do
    include_reviewer = include_reviewer?(args)
    need_reviewer = needs_reviewer?(args)
    include_assignees = include_assignees?(args)

    query
    |> join(:left, [p], company in assoc(p, :company), as: :company)
    |> join(:left, [p], c in assoc(p, :champion), as: :champion)
    |> join(:left, [p], lci in assoc(p, :last_check_in), as: :last_check_in)
    |> preload([company: company, champion: c, last_check_in: lci],
      company: company,
      champion: c,
      last_check_in: lci
    )
    |> preload_project_milestones()
    |> maybe_preload_project_reviewer(include_reviewer || need_reviewer)
    |> maybe_preload_project_contributors(include_assignees || needs_contributor?(args))
    |> preload_space_if_authorized(person)
    |> preload_access_levels()
  end

  defp maybe_preload_project_reviewer(query, true) do
    query
    |> join(:left, [p], r in assoc(p, :reviewer), as: :reviewer)
    |> preload([reviewer: r], reviewer: r)
  end

  defp maybe_preload_project_reviewer(query, false), do: query

  defp maybe_preload_project_contributors(query, true), do: preload(query, [], :contributing_people)
  defp maybe_preload_project_contributors(query, false), do: query

  defp preload_project_milestones(query) do
    subquery =
      from(m in Operately.Projects.Milestone,
        select: %{id: m.id, title: m.title, status: m.status, timeframe: m.timeframe}
      )

    preload(query, [], milestones: ^subquery)
  end

  defp preload_goal_associations(query, args, person) do
    include_assignees = include_assignees?(args)
    include_reviewer = include_reviewer?(args)
    need_reviewer = needs_reviewer?(args)
    need_reviewer_or_assignees = need_reviewer || include_reviewer || include_assignees

    query
    |> join(:left, [goal: g], company in assoc(g, :company), as: :company)
    |> join(:left, [goal: g], c in assoc(g, :champion), as: :champion)
    |> preload([company: company, champion: c], [
      :targets,
      :checks,
      company: company,
      champion: c
    ])
    |> maybe_preload_goal_reviewer(need_reviewer_or_assignees)
    |> preload_space_if_authorized(person)
    |> preload_access_levels()
  end

  defp maybe_preload_goal_reviewer(query, true) do
    query
    |> join(:left, [goal: g], r in assoc(g, :reviewer), as: :reviewer)
    |> preload([reviewer: r], reviewer: r)
  end

  defp maybe_preload_goal_reviewer(query, false), do: query

  defp preload_space_if_authorized(query, person) do
    preload(query, [], group: ^space_preload_query(person))
  end

  defp space_preload_query(:system), do: from(g in Group)

  defp space_preload_query(%Operately.People.Person{id: requester_id}) do
    Filters.filter_by_view_access(Group, requester_id)
  end

  defp space_preload_query(_person) do
    from(g in Group, where: false)
  end

  #
  # Access
  #

  defp preload_access_levels(query) do
    subquery =
      from(c in Operately.Access.Context,
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

  defp filter_by_view_access(query, person, _name) do
    Logger.warning("Invalid person for view access filter: #{inspect(person)}")
    where(query, [p], false)
  end
end
