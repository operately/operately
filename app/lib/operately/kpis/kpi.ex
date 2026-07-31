defmodule Operately.Kpis.Kpi do
  use Operately.Schema

  schema "kpis" do
    belongs_to(:space, Operately.Groups.Group, foreign_key: :space_id)
    belongs_to(:champion, Operately.People.Person, foreign_key: :champion_id)

    has_many(:entries, Operately.Kpis.KpiEntry)

    field(:name, :string)
    field(:unit, :string)
    field(:cadence, Ecto.Enum, values: [:weekly, :monthly])

    timestamps()
  end

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(kpi, attrs) do
    kpi
    |> cast(attrs, [:space_id, :champion_id, :name, :unit, :cadence])
    |> validate_required([:space_id, :name, :unit, :cadence])
  end
end
