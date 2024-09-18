defmodule Operately.Access.BindedPeopleLoader do
  @moduledoc """
  Looks up all the people who are bound to a context.
  """

  import Ecto.Query, only: [from: 2]

  def load(access_context_id) do
    from(p in Operately.People.Person,
      join: m in assoc(p, :access_group_memberships),
      join: g in assoc(m, :group),
      join: b in assoc(g, :bindings),
      join: c in assoc(b, :context),
      where: c.id == ^access_context_id and is_nil(p.suspended_at),
      group_by: p.id,
      select: %{person: p, access_level: max(b.access_level)}
    )
    |> Operately.Repo.all()
    |> Enum.map(fn %{person: p, access_level: level} -> 
      %{p | access_level: level} 
    end)
  end

end
