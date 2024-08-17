defmodule Operately.Access.Filters do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access.Binding

  def get_resource_and_access_level(query, person_id) do
    from([resource: r] in query,
      join: c in assoc(r, :access_context),
      join: b in assoc(c, :bindings),
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      where: m.person_id == ^person_id and b.access_level >= ^Binding.view_access(),
      where: is_nil(p.suspended_at),
      group_by: r.id,
      select: {r, max(b.access_level)}
    )
    |> Repo.one()
    |> case do
      nil -> {:error, :not_found}
      {r, level} -> {:ok, r, level}
    end
  end

  def filter_by_view_access(query, person_id, opts \\ []) do
    query
    |> join_context(opts)
    |> filter(person_id, Binding.view_access())
  end

  def filter_by_edit_access(query, person_id, opts \\ []) do
    query
    |> join_context(opts)
    |> filter(person_id, Binding.edit_access())
  end

  def filter_by_full_access(query, person_id, opts \\ []) do
    query
    |> join_context(opts)
    |> filter(person_id, Binding.full_access())
  end

  def forbidden_or_not_found(query, person_id, opts \\ []) do
    query = filter_by_view_access(query, person_id, opts)

    if Repo.exists?(query) do
      {:error, :forbidden}
    else
      {:error, :not_found}
    end
  end

  defp filter(query, person_id, access_level) do
    from([context: c] in query,
      join: b in assoc(c, :bindings),
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      join: p in assoc(m, :person),
      where: m.person_id == ^person_id and b.access_level >= ^access_level,
      where: is_nil(p.suspended_at),
      distinct: true
    )
  end

  defp join_context(query, join_parent: parent, named_binding: name) do
    from([{^name, item}] in query,
      join: p in assoc(item, ^parent),
      join: c in assoc(p, :access_context), as: :context
    )
  end
  defp join_context(query, join_parent: parent) do
    from(item in query,
      join: p in assoc(item, ^parent),
      join: c in assoc(p, :access_context), as: :context
    )
  end
  defp join_context(query, named_binding: name) do
    from([{^name, item}] in query,
      join: c in assoc(item, :access_context), as: :context
    )
  end
  defp join_context(query, _) do
    from(item in query, join: c in assoc(item, :access_context), as: :context)
  end
end
