defmodule Operately.Kpis.DataPoint do
  use Operately.Schema

  schema "kpi_data_points" do
    belongs_to :kpi, Operately.Kpis.Kpi, foreign_key: :kpi_id

    field :value, :float
    field :recorded_for, :date

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(data_point, attrs) do
    data_point
    |> cast(attrs, [:kpi_id, :value, :recorded_for])
    |> validate_required([:kpi_id, :value, :recorded_for])
  end
end
