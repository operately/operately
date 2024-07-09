defmodule Operately.Access.AccessLevelsLoader do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access.Binding

  defstruct [
    :anonymous_users,
    :company_members,
    :space_members,
  ]

  def load(context_id, company_id, space_id) do
    %__MODULE__{
      anonymous_users: query_access_level(context_id, {:company_id, company_id}, :anonymous),
      company_members: query_access_level(context_id, {:company_id, company_id}, :standard),
      space_members: query_access_level(context_id, {:group_id, space_id}, :standard),
    }
  end

  defp query_access_level(context_id, {group_field, group_id}, tag) do
    from(b in Binding,
      join: c in assoc(b, :context),
      join: g in assoc(b, :group),
      where: field(g, ^group_field) == ^group_id and g.tag == ^tag and c.id == ^context_id,
      select: b.access_level
    )
    |> Repo.one()
    |> case do
      nil -> Binding.no_access()
      access_level -> access_level
    end
  end
end
