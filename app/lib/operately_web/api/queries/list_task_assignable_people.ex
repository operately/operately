defmodule OperatelyWeb.Api.Queries.ListTaskAssignablePeople do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.People.Person
  alias Operately.Access.Binding
  alias OperatelyWeb.Api.Serializer
  alias Operately.Groups.Group

  inputs do
    field :id, :id, null: false
    field :type, :task_type, null: false
    field? :query, :string, null: true
    field? :ignored_ids, list_of(:id), null: true
  end

  outputs do
    field :people, list_of(:person), null: true
  end

  def call(conn, inputs) do
    me = me(conn)

    with {:ok, access_context} <- load_access_context(me, inputs),
         {:ok, people} <- load_people(access_context.id, inputs) do
      {:ok, %{people: Serializer.serialize(people, level: :essential)}}
    else
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp load_access_context(me, %{id: id, type: :project}) do
    case Operately.Projects.Project.get(me, id: id, opts: [preload: [:access_context]]) do
      {:ok, project} -> {:ok, project.access_context}
      {:error, _} -> {:error, :not_found}
    end
  end

  defp load_access_context(me, %{id: id, type: :space}) do
    case Group.get(me, id: id, opts: [preload: [:access_context]]) do
      {:ok, space} -> {:ok, space.access_context}
      {:error, _} -> {:error, :not_found}
    end
  end

  defp load_access_context(_me, _inputs), do: {:error, :not_found}

  defp load_people(access_context_id, inputs) do
    people =
      from(p in Person,
        join: m in assoc(p, :access_group_memberships),
        join: g in assoc(m, :group),
        join: b in assoc(g, :bindings),
        join: c in assoc(b, :context),
        where: c.id == ^access_context_id and is_nil(p.suspended_at) and b.access_level >= ^Binding.view_access(),
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

    {:ok, people}
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
