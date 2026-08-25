defmodule Operately.Activities.Content.KpiAnnotationAdded do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :kpi, Operately.Kpis.Kpi
    belongs_to :annotation, Operately.Kpis.KpiAnnotation

    field :title, :string
    field :date, :date
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :kpi_id, :annotation_id, :title, :date])
  end

  def build(params) do
    changeset(params)
  end
end
