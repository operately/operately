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

  def call(conn, inputs) do
    person = me(conn)
    query = String.trim(inputs.query)

    if String.length(query) < 2 do
      {:ok, %{projects: [], goals: [], milestones: [], tasks: [], people: []}}
    else
      [projects, goals, milestones, tasks, people] =
        [
          Task.async(fn -> search_projects(person, query) end),
          Task.async(fn -> search_goals(person, query) end),
          Task.async(fn -> search_milestones(person, query) end),
          Task.async(fn -> search_tasks(person, query) end),
          Task.async(fn -> search_people(person, query) end)
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

  defp search_projects(person, search_term) do
    ilike_query = "%" <> search_term <> "%"

    ranked_projects_query =
      from(p in Project, as: :project)
      |> Project.scope_company(person.company_id)
      |> where([p], p.status != "closed")
      |> where([p], ilike(p.name, ^ilike_query))
      |> filter_by_view_access(person.id)
      |> select([p], %{
        id: p.id,
        search_rank: fragment("POSITION(LOWER(?) IN LOWER(?))", ^search_term, p.name)
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
    ilike_query = "%" <> search_term <> "%"

    ranked_goals_query =
      from(g in Goal, as: :goal)
      |> Goal.scope_company(person.company_id)
      |> where([g], is_nil(g.closed_at))
      |> where([g], ilike(g.name, ^ilike_query))
      |> filter_by_view_access(person.id)
      |> select([g], %{
        id: g.id,
        search_rank: fragment("POSITION(LOWER(?) IN LOWER(?))", ^search_term, g.name)
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
    ilike_query = "%" <> search_term <> "%"

    ranked_milestones_query =
      from(m in Milestone, as: :milestone)
      |> join(:inner, [m], p in assoc(m, :project), as: :project)
      |> where([_m, p], p.company_id == ^person.company_id)
      |> where([_m, p], p.status != "closed")
      |> where([m], m.status != :done)
      |> where([m], ilike(m.title, ^ilike_query))
      |> filter_by_view_access(person.id, named_binding: :project)
      |> select([m], %{
        id: m.id,
        search_rank: fragment("POSITION(LOWER(?) IN LOWER(?))", ^search_term, m.title)
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

    ilike_query = "%" <> search_term <> "%"

    ranked_tasks_query =
      from(t in Task, as: :task)
      |> join(:inner, [t], m in assoc(t, :milestone))
      |> join(:inner, [t, m], p in assoc(m, :project), as: :project)
      |> Task.scope_company(person.company_id)
      |> where([_t, _m, p], p.status != "closed")
      |> where([t], ilike(t.name, ^ilike_query))
      |> filter_by_view_access(person.id, named_binding: :project)
      |> select([t], %{
        id: t.id,
        search_rank: fragment("POSITION(LOWER(?) IN LOWER(?))", ^search_term, t.name)
      })

    limited_tasks =
      from(r in subquery(ranked_tasks_query),
        order_by: [asc: r.search_rank, asc: r.id],
        limit: @limit
      )

    from(t in Task, join: r in subquery(limited_tasks), on: t.id == r.id, preload: [:project, :group], order_by: [asc: r.search_rank, asc: t.id], select: t)
    |> Repo.all()
  end

  defp search_people(person, query) do
    ilike_query = "%" <> query <> "%"

    from(p in Person)
    |> where([p], p.company_id == ^person.company_id)
    |> where([p], p.suspended == false)
    |> where([p], ilike(p.full_name, ^ilike_query) or ilike(p.title, ^ilike_query))
    |> order_by([p],
      asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^query, p.full_name),
      asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^query, p.title),
      asc: p.full_name
    )
    |> limit(@limit)
    |> Repo.all()
  end
end
