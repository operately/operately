defmodule Operately.Kpis.KpiEntry do
  use Operately.Schema

  schema "kpi_entries" do
    belongs_to(:kpi, Operately.Kpis.Kpi, foreign_key: :kpi_id)
    belongs_to(:recorded_by, Operately.People.Person, foreign_key: :recorded_by_id)

    field(:value, :float)
    field(:period, :date)

    timestamps()
  end

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(entry, attrs) do
    entry
    |> cast(attrs, [:kpi_id, :value, :period, :recorded_by_id])
    |> validate_required([:kpi_id, :value, :period, :recorded_by_id])
  end
end
