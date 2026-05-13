defmodule OperatelyWeb.Api.Tasks.ListPotentialAssignees do
  @moduledoc """
  Lists potential assignees for a task in a project or space.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.People.Person
  alias Operately.Access.Binding
  alias OperatelyWeb.Api.Serializer
  alias Operately.Groups.Group
  alias Operately.Groups.Member
  alias Operately.Projects.Contributor
  alias Operately.Projects.Project

  inputs do
    field :id, :id, null: false
    field :type, :task_type, null: false
    field? :query, :string, null: true
    field? :ignored_ids, list_of(:id), null: true
  end

  outputs do
    field :people, list_of(:person), null: false
  end

  def call(conn, inputs) do
    me = me(conn)

    with {:ok, scope} <- load_scope(me, inputs),
         {:ok, people} <- load_people(scope, me, inputs) do
      {:ok, %{people: Serializer.serialize(people, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp load_scope(me, %{id: id, type: :project}) do
    case Project.get(me, id: id, opts: [preload: [:access_context]]) do
      {:ok, project} ->
        {:ok,
         %{
           type: :project,
           access_context_id: project.access_context.id,
           project_id: project.id,
           space_id: project.group_id
         }}

      {:error, _} -> {:error, :not_found}
    end
  end

  defp load_scope(me, %{id: id, type: :space}) do
    case Group.get(me, id: id, opts: [preload: [:access_context]]) do
      {:ok, space} ->
        {:ok,
         %{
           type: :space,
           access_context_id: space.access_context.id,
           space_id: space.id
         }}

      {:error, _} -> {:error, :not_found}
    end
  end

  defp load_scope(_me, _inputs), do: {:error, :not_found}

  defp load_people(scope, me, inputs) do
    project_contributor_ids = project_contributor_ids(scope)
    space_member_ids = space_member_ids(scope.space_id)

    people =
      from(p in Person,
        join: m in assoc(p, :access_group_memberships),
        join: g in assoc(m, :group),
        join: b in assoc(g, :bindings),
        join: c in assoc(b, :context),
        where: c.id == ^scope.access_context_id and is_nil(p.suspended_at) and b.access_level >= ^Binding.view_access(),
        group_by: p.id,
        select: %{person: p, access_level: max(b.access_level)},
        order_by: [asc: p.full_name]
      )
      |> maybe_filter_query(inputs[:query])
      |> maybe_ignore_ids(inputs[:ignored_ids])
      |> Repo.all()
      |> Enum.map(fn %{person: p, access_level: level} ->
        %{p | access_level: level}
      end)
      |> maybe_filter_preferred_people(inputs[:query], me.id, project_contributor_ids, space_member_ids)
      |> sort_people(me.id, project_contributor_ids, space_member_ids)

    {:ok, people}
  end

  defp project_contributor_ids(%{type: :project, project_id: project_id}) do
    from(c in Contributor, where: c.project_id == ^project_id, select: c.person_id)
    |> Repo.all()
    |> MapSet.new()
  end

  defp project_contributor_ids(_scope), do: MapSet.new()

  defp space_member_ids(space_id) do
    from(m in Member, where: m.group_id == ^space_id, select: m.person_id)
    |> Repo.all()
    |> MapSet.new()
  end

  defp maybe_filter_preferred_people(people, query, me_id, project_contributor_ids, space_member_ids) when query in [nil, ""] do
    Enum.filter(people, fn person ->
      person.id == me_id or MapSet.member?(project_contributor_ids, person.id) or MapSet.member?(space_member_ids, person.id)
    end)
  end

  defp maybe_filter_preferred_people(people, _query, _me_id, _project_contributor_ids, _space_member_ids), do: people

  defp sort_people(people, me_id, project_contributor_ids, space_member_ids) do
    Enum.sort_by(people, fn person ->
      {person_rank(person, me_id, project_contributor_ids, space_member_ids), String.downcase(person.full_name || "")}
    end)
  end

  defp person_rank(person, me_id, project_contributor_ids, space_member_ids) do
    cond do
      person.id == me_id -> 0
      MapSet.member?(project_contributor_ids, person.id) -> 1
      MapSet.member?(space_member_ids, person.id) -> 2
      true -> 3
    end
  end

  defp maybe_filter_query(query, nil), do: query
  defp maybe_filter_query(query, ""), do: query

  defp maybe_filter_query(query, search) do
    from([p, m, g, b, c] in query, where: ilike(p.full_name, ^"%#{search}%") or ilike(p.title, ^"%#{search}%"))
  end

  defp maybe_ignore_ids(query, nil), do: query
  defp maybe_ignore_ids(query, []), do: query

  defp maybe_ignore_ids(query, ids) do
    from([p, m, g, b, c] in query, where: p.id not in ^ids)
  end
end
