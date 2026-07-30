defmodule Operately.Kpis.Kpi do
  use Operately.Schema

  schema "kpis" do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :creator, Operately.People.Person

    has_many :data_points, Operately.Kpis.DataPoint

    field :name, :string
    field :unit, :string
    field :target, :float

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(kpi, attrs) do
    kpi
    |> cast(attrs, [:company_id, :space_id, :creator_id, :name, :unit, :target])
    |> validate_required([:company_id, :space_id, :name])
  end

  #
  # Scopes
  #

  import Ecto.Query, only: [from: 2]

  def scope_company(query, company_id) do
    from k in query, where: k.company_id == ^company_id
  end

  def scope_space(query, space_id) do
    from k in query, where: k.space_id == ^space_id
  end
end
