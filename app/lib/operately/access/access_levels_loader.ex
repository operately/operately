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

  @doc "Loads access levels for a collection, indexed by context ID."
  def load_many([]), do: %{}

  def load_many(identifiers) do
    context_ids = Enum.map(identifiers, & &1.context_id)
    company_ids = identifiers |> Enum.map(& &1.company_id) |> Enum.uniq()
    space_ids = Enum.map(identifiers, & &1.space_id)

    bindings_by_context =
      from(b in Binding,
        join: c in assoc(b, :context),
        join: g in assoc(b, :group),
        where: b.context_id in ^context_ids,
        where: (g.company_id in ^company_ids and g.tag in [:anonymous, :standard]) or (g.group_id in ^space_ids and g.tag == :standard),
        select: %{context_id: c.id, company_id: g.company_id, group_id: g.group_id, tag: g.tag, access_level: b.access_level}
      )
      |> Repo.all()
      |> Enum.group_by(& &1.context_id)

    Map.new(identifiers, fn %{context_id: context_id, company_id: company_id, space_id: space_id} ->
      bindings = Map.get(bindings_by_context, context_id, [])

      access_levels = %__MODULE__{
        public: matching_access_level(bindings, {:company_id, company_id}, :anonymous),
        company: matching_access_level(bindings, {:company_id, company_id}, :standard),
        space: matching_access_level(bindings, {:group_id, space_id}, :standard)
      }

      {context_id, access_levels}
    end)
  end

  defp matching_access_level(bindings, {group_field, group_id}, tag) do
    matches = Enum.filter(bindings, &(Map.fetch!(&1, group_field) == group_id and &1.tag == tag))

    case matches do
      [] -> Binding.no_access()
      [binding] -> binding.access_level || Binding.no_access()
      _ -> raise Ecto.MultipleResultsError, queryable: Binding, count: length(matches)
    end
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
