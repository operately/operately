defmodule OperatelyWeb.Api.Queries.GlobalSearch do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query
  import Operately.Access.Filters, only: [filter_by_view_access: 2, filter_by_view_access: 3]

  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.Projects.Milestone
  alias Operately.Goals.Goal
  alias Operately.People.Person
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :query, :string
  end

  outputs do
    field :projects, list_of(:project)
    field :goals, list_of(:goal)
    field :milestones, list_of(:milestone)
    field :tasks, list_of(:task)
    field :people, list_of(:person)
  end

  @limit 5

  # Normalization SQL: LOWER + hyphens/underscores → spaces, so "re establish" matches "re-establish".
  # Fragment strings must be literals (Ecto security); keep these two in sync if normalization changes.
  defmacrop norm_col_like do
    "regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g') LIKE ?"
  end

  defmacrop norm_col_position do
    "POSITION(LOWER(?) IN regexp_replace(regexp_replace(LOWER(?), '[-_]', ' ', 'g'), ' +', ' ', 'g'))"
  end

  # Normalize so "re establish" matches "re-establish" (hyphens/underscores ≈ spaces)
  defp normalize_search_term(query) do
    query
    |> String.replace(~r/[-_\s]+/, " ")
    |> String.trim()
  end

  def call(conn, inputs) do
    person = me(conn)
    query = String.trim(inputs.query)

    if String.length(query) < 2 do
      {:ok, %{projects: [], goals: [], milestones: [], tasks: [], people: []}}
    else
      normalized = normalize_search_term(query)
      if normalized == "" do
        {:ok, %{projects: [], goals: [], milestones: [], tasks: [], people: []}}
      else
        [projects, goals, milestones, tasks, people] =
          [
            Task.async(fn -> search_projects(person, normalized) end),
            Task.async(fn -> search_goals(person, normalized) end),
            Task.async(fn -> search_milestones(person, normalized) end),
            Task.async(fn -> search_tasks(person, normalized) end),
            Task.async(fn -> search_people(person, normalized) end)
          ]
          |> Task.await_many()

        output = %{
          projects: Serializer.serialize(projects, level: :full),
          goals: Serializer.serialize(goals, level: :essential),
          milestones: Serializer.serialize(milestones, level: :essential),
          tasks: Serializer.serialize(tasks, level: :full),
          people: Serializer.serialize(people, level: :essential)
        }

        {:ok, output}
      end
    end
  end

  defp search_projects(person, search_term) do
    pattern = "%" <> String.downcase(search_term) <> "%"

    ranked_projects_query =
      from(p in Project, as: :project)
      |> Project.scope_company(person.company_id)
      |> where([p], p.status != "closed")
      |> where([p], fragment(norm_col_like(), p.name, ^pattern))
      |> filter_by_view_access(person.id)
      |> select([p], %{
        id: p.id,
        search_rank: fragment(norm_col_position(), ^search_term, p.name)
      })

    limited_projects =
      from(r in subquery(ranked_projects_query),
        order_by: [asc: r.search_rank, asc: r.id],
        limit: @limit
      )

    from(p in Project, join: r in subquery(limited_projects), on: p.id == r.id, preload: [:champion, :reviewer, :group], order_by: [asc: r.search_rank, asc: p.id], select: p)
    |> Repo.all()
  end

  defp search_goals(person, search_term) do
    pattern = "%" <> String.downcase(search_term) <> "%"

    ranked_goals_query =
      from(g in Goal, as: :goal)
      |> Goal.scope_company(person.company_id)
      |> where([g], is_nil(g.closed_at))
      |> where([g], fragment(norm_col_like(), g.name, ^pattern))
      |> filter_by_view_access(person.id)
      |> select([g], %{
        id: g.id,
        search_rank: fragment(norm_col_position(), ^search_term, g.name)
      })

    limited_goals =
      from(r in subquery(ranked_goals_query),
        order_by: [asc: r.search_rank, asc: r.id],
        limit: @limit
      )

    from(g in Goal, join: r in subquery(limited_goals), on: g.id == r.id, preload: [:champion, :reviewer, :group], order_by: [asc: r.search_rank, asc: g.id], select: g)
    |> Repo.all()
  end

  defp search_milestones(person, search_term) do
    pattern = "%" <> String.downcase(search_term) <> "%"

    ranked_milestones_query =
      from(m in Milestone, as: :milestone)
      |> join(:inner, [m], p in assoc(m, :project), as: :project)
      |> where([_m, p], p.company_id == ^person.company_id)
      |> where([_m, p], p.status != "closed")
      |> where([m], m.status != :done)
      |> where([m], fragment(norm_col_like(), m.title, ^pattern))
      |> filter_by_view_access(person.id, named_binding: :project)
      |> select([m], %{
        id: m.id,
        search_rank: fragment(norm_col_position(), ^search_term, m.title)
      })

    limited_milestones =
      from(r in subquery(ranked_milestones_query),
        order_by: [asc: r.search_rank, asc: r.id],
        limit: @limit
      )

    from(m in Milestone, join: r in subquery(limited_milestones), on: m.id == r.id, preload: [:project, :creator, :space], order_by: [asc: r.search_rank, asc: m.id], select: m)
    |> Repo.all()
  end

  defp search_tasks(person, search_term) do
    alias Operately.Tasks.Task

    pattern = "%" <> String.downcase(search_term) <> "%"

    # 1. Project Tasks
    project_tasks_query =
      from(t in Task, as: :task)
      |> join(:inner, [t], m in assoc(t, :milestone))
      |> join(:inner, [t, m], p in assoc(m, :project), as: :project)
      |> Task.scope_company(person.company_id)
      |> where([_t, _m, p], p.status != "closed")
      |> where([t], fragment("NOT (?->>'closed')::boolean", t.task_status))
      |> where([t], fragment(norm_col_like(), t.name, ^pattern))
      |> filter_by_view_access(person.id, named_binding: :project)
      |> select([t], %{
        id: t.id,
        search_rank: fragment(norm_col_position(), ^search_term, t.name)
      })
      |> limit(@limit)

    # 2. Space Tasks (Directly on Space)
    space_tasks_query =
      from(t in Task, as: :task)
      |> join(:inner, [t], s in assoc(t, :space), as: :space)
      |> where([t, s], s.company_id == ^person.company_id)
      |> where([t], fragment("NOT (?->>'closed')::boolean", t.task_status))
      |> where([t], fragment(norm_col_like(), t.name, ^pattern))
      |> filter_by_view_access(person.id, named_binding: :space)
      |> select([t], %{
        id: t.id,
        search_rank: fragment(norm_col_position(), ^search_term, t.name)
      })
      |> limit(@limit)

    # Execute queries
    project_results = Repo.all(project_tasks_query)
    space_results = Repo.all(space_tasks_query)

    # Merge and Sort
    top_results =
      (project_results ++ space_results)
      |> Enum.uniq_by(& &1.id)
      |> Enum.sort_by(&{&1.search_rank, &1.id})
      |> Enum.take(@limit)

    # Fetch full records for the top results
    top_ids = Enum.map(top_results, & &1.id)

    from(t in Task, where: t.id in ^top_ids, preload: [:project, :project_space, :space], select: t)
    |> Repo.all()
    |> Enum.sort_by(fn t ->
      Enum.find_index(top_results, & &1.id == t.id)
    end)
  end

  defp search_people(person, search_term) do
    pattern = "%" <> String.downcase(search_term) <> "%"

    from(p in Person)
    |> where([p], p.company_id == ^person.company_id)
    |> where([p], p.suspended == false)
    |> where([p],
      fragment(norm_col_like(), p.full_name, ^pattern) or
        fragment(norm_col_like(), p.title, ^pattern)
    )
    |> order_by([p],
      asc: fragment(norm_col_position(), ^search_term, p.full_name),
      asc: fragment(norm_col_position(), ^search_term, p.title),
      asc: p.full_name
    )
    |> limit(@limit)
    |> Repo.all()
  end
end
