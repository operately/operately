defmodule Operately.Search.QuickSearch do
  @moduledoc """
  Runs the canonical title and name search used by company quick navigation.
  """

  import Ecto.Query
  import Operately.Access.Filters, only: [filter_by_view_access: 2, filter_by_view_access: 3]

  alias Operately.Goals.Goal
  alias Operately.Groups.Group, as: Space
  alias Operately.Messages.Message
  alias Operately.People.Person
  alias Operately.Projects.{Milestone, Project}
  alias Operately.Repo
  alias Operately.Search.QuickSearch.ResourceHubItems
  alias Operately.Search.Text

  @limit 5
  @empty_results %{
    spaces: [],
    projects: [],
    goals: [],
    milestones: [],
    tasks: [],
    people: [],
    discussions: [],
    folders: [],
    documents: [],
    files: [],
    links: []
  }
  @legacy_empty_results Map.take(@empty_results, [:spaces, :projects, :goals, :milestones, :tasks, :people])

  def search(%Person{} = person, query) do
    case prepare_query(query) do
      {:ok, search_term} -> run_searches(person, search_term)
      :error -> @empty_results
    end
  end

  @doc """
  Runs only the six grouped searches returned by the compatibility API.
  """
  def search_legacy_groups(%Person{} = person, query) do
    case prepare_query(query) do
      {:ok, search_term} -> run_legacy_searches(person, search_term)
      :error -> @legacy_empty_results
    end
  end

  defp prepare_query(query) do
    with {:ok, query} <- Text.prepare_query(query),
         search_term when search_term != "" <- Text.normalize_search_term(query) do
      {:ok, search_term}
    else
      _ -> :error
    end
  end

  defp run_searches(person, search_term) do
    [spaces, projects, goals, milestones, tasks, people, discussions, resource_hub_items] =
      (legacy_search_tasks(person, search_term) ++
         [
           Task.async(fn -> search_discussions(person, search_term) end),
           Task.async(fn -> ResourceHubItems.search(person, search_term) end)
         ])
      |> Task.await_many()

    Map.merge(resource_hub_items, %{
      spaces: spaces,
      projects: projects,
      goals: goals,
      milestones: milestones,
      tasks: tasks,
      people: people,
      discussions: discussions
    })
  end

  defp run_legacy_searches(person, search_term) do
    [spaces, projects, goals, milestones, tasks, people] =
      person
      |> legacy_search_tasks(search_term)
      |> Task.await_many()

    %{
      spaces: spaces,
      projects: projects,
      goals: goals,
      milestones: milestones,
      tasks: tasks,
      people: people
    }
  end

  defp legacy_search_tasks(person, search_term) do
    [
      Task.async(fn -> search_spaces(person, search_term) end),
      Task.async(fn -> search_projects(person, search_term) end),
      Task.async(fn -> search_goals(person, search_term) end),
      Task.async(fn -> search_milestones(person, search_term) end),
      Task.async(fn -> search_tasks(person, search_term) end),
      Task.async(fn -> search_people(person, search_term) end)
    ]
  end

  defp search_spaces(person, search_term) do
    ranked_spaces =
      from(space in Space, as: :space)
      |> Space.scope_company(person.company_id)
      |> filter_by_view_access(person.id)
      |> rank_matches(:space, :name, search_term)

    from(space in Space,
      join: rank in subquery(limit_matches(ranked_spaces)),
      on: space.id == rank.id,
      order_by: [asc: rank.search_rank, asc: space.id],
      select: space
    )
    |> Repo.all()
  end

  defp search_projects(person, search_term) do
    ranked_projects =
      from(project in Project, as: :project)
      |> Project.scope_company(person.company_id)
      |> where([project], project.status != "closed")
      |> filter_by_view_access(person.id)
      |> rank_matches(:project, :name, search_term)

    from(project in Project,
      join: rank in subquery(limit_matches(ranked_projects)),
      on: project.id == rank.id,
      preload: [:champion, :reviewer, :group],
      order_by: [asc: rank.search_rank, asc: project.id],
      select: project
    )
    |> Repo.all()
  end

  defp search_goals(person, search_term) do
    ranked_goals =
      from(goal in Goal, as: :goal)
      |> Goal.scope_company(person.company_id)
      |> where([goal], is_nil(goal.closed_at))
      |> filter_by_view_access(person.id)
      |> rank_matches(:goal, :name, search_term)

    from(goal in Goal,
      join: rank in subquery(limit_matches(ranked_goals)),
      on: goal.id == rank.id,
      preload: [:champion, :reviewer, :group],
      order_by: [asc: rank.search_rank, asc: goal.id],
      select: goal
    )
    |> Repo.all()
  end

  defp search_milestones(person, search_term) do
    ranked_milestones =
      from(milestone in Milestone,
        as: :milestone,
        join: project in assoc(milestone, :project),
        as: :project,
        where: project.company_id == ^person.company_id,
        where: project.status != "closed",
        where: milestone.status != :done
      )
      |> filter_by_view_access(person.id, named_binding: :project)
      |> rank_matches(:milestone, :title, search_term)

    from(milestone in Milestone,
      join: rank in subquery(limit_matches(ranked_milestones)),
      on: milestone.id == rank.id,
      preload: [:project, :creator, :space],
      order_by: [asc: rank.search_rank, asc: milestone.id],
      select: milestone
    )
    |> Repo.all()
  end

  defp search_tasks(person, search_term) do
    alias Operately.Tasks.Task

    project_tasks =
      from(task in Task,
        as: :task,
        join: milestone in assoc(task, :milestone),
        join: project in assoc(milestone, :project),
        as: :project,
        where: project.company_id == ^person.company_id,
        where: project.status != "closed",
        where: fragment("NOT (?->>'closed')::boolean", task.task_status)
      )
      |> filter_by_view_access(person.id, named_binding: :project)
      |> rank_matches(:task, :name, search_term)
      |> limit(@limit)

    space_tasks =
      from(task in Task,
        as: :task,
        join: space in assoc(task, :space),
        as: :space,
        where: space.company_id == ^person.company_id,
        where: fragment("NOT (?->>'closed')::boolean", task.task_status)
      )
      |> filter_by_view_access(person.id, named_binding: :space)
      |> rank_matches(:task, :name, search_term)
      |> limit(@limit)

    top_results =
      (Repo.all(project_tasks) ++ Repo.all(space_tasks))
      |> Enum.uniq_by(& &1.id)
      |> Enum.sort_by(&{&1.search_rank, &1.id})
      |> Enum.take(@limit)

    top_ids = Enum.map(top_results, & &1.id)

    from(task in Task,
      where: task.id in ^top_ids,
      preload: [:project, :project_space, :space],
      select: task
    )
    |> Repo.all()
    |> Enum.sort_by(fn task -> Enum.find_index(top_results, &(&1.id == task.id)) end)
  end

  defp search_people(person, search_term) do
    pattern = match_pattern(search_term)

    from(person_record in Person,
      where: person_record.company_id == ^person.company_id,
      where: person_record.suspended == false,
      where:
        # Treats hyphens and underscores as spaces in names.
        fragment(
          "regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g') LIKE ?",
          person_record.full_name,
          ^pattern
        ) or
          # Treats hyphens and underscores as spaces in job titles.
          fragment(
            "regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g') LIKE ?",
            person_record.title,
            ^pattern
          ),
      order_by: [
        asc:
          # Ranks matches nearer the name's start first.
          fragment(
            "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))",
            ^search_term,
            person_record.full_name
          ),
        asc:
          # Then ranks matches nearer the job title's start.
          fragment(
            "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))",
            ^search_term,
            person_record.title
          ),
        asc: person_record.full_name
      ],
      limit: @limit
    )
    |> Repo.all()
  end

  defp search_discussions(person, search_term) do
    pattern = match_pattern(search_term)

    ranked_discussions =
      from(message in Message,
        join: board in assoc(message, :messages_board),
        join: space in assoc(board, :space),
        as: :space,
        where: space.company_id == ^person.company_id,
        where: is_nil(space.deleted_at),
        where: message.state == :published,
        where: is_nil(message.deleted_at),
        where:
          # Treats hyphens and underscores as spaces.
          fragment(
            "regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g') LIKE ?",
            message.title,
            ^pattern
          )
      )
      |> filter_by_view_access(person.id, named_binding: :space)
      |> select([message, _board, space: space], %{
        id: message.id,
        title: message.title,
        context: space.name,
        search_rank:
          # Ranks matches nearer the title's start first.
          fragment(
            "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))",
            ^search_term,
            message.title
          )
      })

    from(discussion in subquery(ranked_discussions),
      order_by: [asc: discussion.search_rank, asc: discussion.id],
      limit: @limit
    )
    |> Repo.all()
    |> Enum.map(&Map.delete(&1, :search_rank))
  end

  defp rank_matches(query, binding, field_name, search_term) do
    pattern = match_pattern(search_term)

    from([{^binding, item}] in query,
      where:
        # Treats hyphens and underscores as spaces.
        fragment(
          "regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g') LIKE ?",
          field(item, ^field_name),
          ^pattern
        ),
      select: %{
        id: item.id,
        search_rank:
          # Ranks matches nearer the value's start first.
          fragment(
            "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))",
            ^search_term,
            field(item, ^field_name)
          )
      }
    )
  end

  defp limit_matches(ranked_query) do
    from(rank in subquery(ranked_query),
      order_by: [asc: rank.search_rank, asc: rank.id],
      limit: @limit
    )
  end

  defp match_pattern(search_term), do: "%#{String.downcase(search_term)}%"
end
