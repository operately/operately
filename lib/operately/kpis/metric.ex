defmodule Operately.Kpis.Metric do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "kpi_metrics" do
    belongs_to :kpi, Operately.Kpis.Kpi

    field :date, :naive_datetime
    field :value, :integer

    timestamps()
  end

  @doc false
  def changeset(metric, attrs) do
    metric
    |> cast(attrs, [:date, :value, :kpi_id])
    |> validate_required([:date, :value])
  end
end
