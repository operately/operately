defmodule Operately.Access.AccessLevels do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Access.Binding

  defstruct [
    :public,
    :company,
    :space,
  ]

  @type t :: %__MODULE__{
          public: Binding.t(),
          company: Binding.t(),
          space: Binding.t(),
        }

  def load(context_id, company_id, space_id) do
    %__MODULE__{
      public: query_access_level(context_id, {:company_id, company_id}, :anonymous),
      company: query_access_level(context_id, {:company_id, company_id}, :standard),
      space: query_access_level(context_id, {:group_id, space_id}, :standard),
    }
  end

  @spec calc_privacy(__MODULE__.t()) :: :public | :internal | :confidential | :secret
  def calc_privacy(access_levels) do
    cond do
      access_levels.public != Operately.Access.Binding.no_access() -> :public
      access_levels.company != Operately.Access.Binding.no_access() -> :internal
      access_levels.space != Operately.Access.Binding.no_access() -> :confidential
      true -> :secret
    end
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
