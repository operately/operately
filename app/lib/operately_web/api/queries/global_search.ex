defmodule OperatelyWeb.Api.Queries.GlobalSearch do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2, limit: 2]
  import Operately.Access.Filters, only: [filter_by_view_access: 2, filter_by_view_access: 3]

  alias Operately.Repo
  alias Operately.Projects.Project
  alias Operately.Goals.Goal
  alias Operately.Tasks.Task
  alias Operately.People.Person
  alias OperatelyWeb.Api.Serializer

  inputs do
    field? :query, :string, null: false
  end

  outputs do
    field? :projects, list_of(:project), null: true
    field? :goals, list_of(:goal), null: true
    field? :tasks, list_of(:task), null: true
    field? :people, list_of(:person), null: true
    field? :work_map_link, :string, null: true
  end

  @limit 5

  def call(conn, inputs) do
    person = me(conn)
    query = String.trim(inputs.query)

    if String.length(query) < 2 do
      {:ok, %{projects: [], goals: [], tasks: [], people: [], work_map_link: nil}}
    else
      projects = search_projects(person, query)
      goals = search_goals(person, query)
      tasks = search_tasks(person, query)
      people = search_people(person, query)
      work_map_link = get_work_map_link()

      output = %{
        projects: Serializer.serialize(projects, level: :essential),
        goals: Serializer.serialize(goals, level: :essential),
        tasks: Serializer.serialize(tasks, level: :essential),
        people: Serializer.serialize(people, level: :essential),
        work_map_link: work_map_link
      }

      {:ok, output}
    end
  end

  defp search_projects(person, query) do
    from(p in Project, as: :project)
    |> Project.scope_company(person.company_id)
    |> where([p], ilike(p.name, ^"%#{query}%"))
    |> filter_by_view_access(person.id)
    |> order_by([p], asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^query, p.name))
    |> limit(@limit)
    |> preload([:champion, :reviewer, :group])
    |> Repo.all()
  end

  defp search_goals(person, query) do
    from(g in Goal, as: :goal)
    |> Goal.scope_company(person.company_id)
    |> where([g], ilike(g.name, ^"%#{query}%"))
    |> filter_by_view_access(person.id)
    |> order_by([g], asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^query, g.name))
    |> limit(@limit)
    |> preload([:champion, :reviewer, :group])
    |> Repo.all()
  end

  defp search_tasks(person, query) do
    from(t in Task, as: :task,
      join: m in assoc(t, :milestone),
      join: p in assoc(m, :project), as: :project
    )
    |> Task.scope_company(person.company_id)
    |> where([t], ilike(t.name, ^"%#{query}%"))
    |> filter_by_view_access(person.id, named_binding: :project)
    |> order_by([t], asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^query, t.name))
    |> limit(@limit)
    |> preload([milestone: [project: [:group]]])
    |> Repo.all()
  end

  defp search_people(person, query) do
    from(p in Person)
    |> where([p], p.company_id == ^person.company_id)
    |> where([p], p.suspended == false)
    |> where([p], ilike(p.full_name, ^"%#{query}%") or ilike(p.title, ^"%#{query}%"))
    |> order_by([p], [
      asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^query, p.full_name),
      asc: fragment("POSITION(LOWER(?) IN LOWER(?))", ^query, p.title),
      asc: p.full_name
    ])
    |> limit(@limit)
    |> Repo.all()
  end

  defp get_work_map_link() do
    "Company Work Map"
  end
end