defmodule Operately.Kpis.KpiEntryEdit do
  use Operately.Schema

  schema "kpi_entry_edits" do
    belongs_to(:kpi_entry, Operately.Kpis.KpiEntry, foreign_key: :kpi_entry_id)
    belongs_to(:edited_by, Operately.People.Person, foreign_key: :edited_by_id)

    field(:previous_value, :float)
    field(:previous_period, :date)

    timestamps()
  end

  def changeset(attrs = %{}) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(edit, attrs) do
    edit
    |> cast(attrs, [:kpi_entry_id, :edited_by_id, :previous_value, :previous_period])
    |> validate_required([:kpi_entry_id, :edited_by_id, :previous_value, :previous_period])
  end
end
