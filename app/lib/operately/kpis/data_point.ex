defmodule Operately.Kpis.DataPoint do
  use Operately.Schema

  schema "kpi_data_points" do
    belongs_to :kpi, Operately.Kpis.Kpi

    field :value, :float
    field :recorded_for, :date

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(data_point, attrs) do
    data_point
    |> cast(attrs, [:kpi_id, :value, :recorded_for])
    |> validate_required([:kpi_id, :value, :recorded_for])
    |> unique_constraint([:kpi_id, :recorded_for],
      name: :kpi_data_points_kpi_id_recorded_for_index,
      message: "a data point already exists for this date"
    )
  end

  #
  # Scopes
  #

  import Ecto.Query, only: [from: 2]

  def scope_kpi(query, kpi_id) do
    from d in query, where: d.kpi_id == ^kpi_id
  end
end
