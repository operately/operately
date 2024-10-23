defmodule Operately.Access.BindedPeopleLoader do
  @moduledoc """
  Looks up all the people who are bound to a context.
  """

  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding

  @type context_id :: binary()
  @type access_level :: :any | :view_access | :comment_access | :edit_access | :full_access

  @spec load(context_id) :: [Operately.People.Person.t()]
  def load(access_content_id), do: load(access_content_id, :any)

  @spec load(context_id, access_level()) :: [Operately.People.Person.t()]
  def load(access_context_id, level)

  def load(access_context_id, :any) do
    from(p in Operately.People.Person,
      join: m in assoc(p, :access_group_memberships),
      join: g in assoc(m, :group),
      join: b in assoc(g, :bindings),
      join: c in assoc(b, :context),
      where: c.id == ^access_context_id and is_nil(p.suspended_at) and b.access_level >= ^Binding.view_access(),
      group_by: p.id,
      select: %{person: p, access_level: max(b.access_level)}
    )
    |> Operately.Repo.all()
    |> Enum.map(fn %{person: p, access_level: level} -> 
      %{p | access_level: level} 
    end)
  end

  def load(access_context_id, level) do
    access_level_value = Binding.from_atom(level)

    from(p in Operately.People.Person,
      join: m in assoc(p, :access_group_memberships),
      join: g in assoc(m, :group),
      join: b in assoc(g, :bindings),
      join: c in assoc(b, :context),
      where: c.id == ^access_context_id and is_nil(p.suspended_at) and b.access_level == ^access_level_value,
      group_by: p.id,
      select: %{person: p, access_level: max(b.access_level)}
    )
    |> Operately.Repo.all()
    |> Enum.map(fn %{person: p, access_level: level} -> 
      %{p | access_level: level} 
    end)
  end

end
