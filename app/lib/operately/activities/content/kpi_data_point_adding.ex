defmodule Operately.Activities.Content.KpiDataPointAdding do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :kpi, Operately.Kpis.Kpi
    belongs_to :data_point, Operately.Kpis.DataPoint

    field :kpi_name, :string
    field :value, :float
    field :recorded_for, :date
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :kpi_id, :data_point_id, :kpi_name, :value, :recorded_for])
  end

  def build(params) do
    changeset(params)
  end
end
