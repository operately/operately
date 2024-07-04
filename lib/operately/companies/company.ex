defmodule Operately.Companies.Company do
  use Operately.Schema

  schema "companies" do
    has_one :access_context, Operately.Access.Context, foreign_key: :company_id

    has_many :access_groups, Operately.Access.Group, foreign_key: :company_id
    has_many :people, Operately.People.Person, foreign_key: :company_id, where: [suspended_at: nil]

    field :mission, :string
    field :name, :string
    field :trusted_email_domains, {:array, :string}
    field :enabled_experimental_features, {:array, :string}, default: []
    field :company_space_id, :binary_id
    field :short_id, :integer

    field :member_count, :integer, virtual: true

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  @doc false
  def changeset(company, attrs) do
    company
    |> cast(attrs, [:name, :mission, :trusted_email_domains, :enabled_experimental_features, :company_space_id, :short_id])
    |> validate_required([:name])
    |> validate_length(:name, min: 3)
  end

  #
  # After load actions
  #

  import Ecto.Query, only: [from: 2]

  def load_member_count(companies) when is_list(companies) do
    ids = Enum.map(companies, fn c -> c.id end)

    query = from c in __MODULE__,
      join: p in assoc(c, :people),
      group_by: c.id,
      where: c.id in ^ids,
      select: {c.id, count(p.id)}

    member_counts = Operately.Repo.all(query)

    Enum.map(companies, fn company ->
      case Enum.find(member_counts, fn {id, _} -> id == company.id end) do
        {_, count} -> Map.put(company, :member_count, count)
        nil -> Map.put(company, :member_count, 0)
      end
    end)
  end

end
