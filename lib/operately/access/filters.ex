defmodule Operately.Access.Filters do
  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding

  def filter_by_view_access(query, person_id), do: filter(query, person_id, Binding.view_access())

  defp filter(query, person_id, access_level) do
    from(item in query,
      join: c in assoc(item, :access_context),
      join: b in assoc(c, :bindings),
      join: g in assoc(b, :group),
      join: m in assoc(g, :memberships),
      where: m.person_id == ^person_id and b.access_level >= ^access_level,
      distinct: true
    )
  end
end
