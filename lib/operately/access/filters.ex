defmodule Operately.Access.Filters do
  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding

  def filter_by_view_access(query, person_id, opts \\ []) do
    query
    |> join_context(opts)
    |> filter(person_id, Binding.view_access())
  end

  defp filter(query, person_id, access_level) do
    from([context: c] in query,
      join: b in assoc(c, :bindings),
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      where: m.person_id == ^person_id and b.access_level >= ^access_level,
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
