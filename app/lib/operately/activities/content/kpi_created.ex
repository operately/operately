defmodule Operately.Activities.Content.KpiCreated do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :kpi, Operately.Kpis.Kpi
    belongs_to :champion, Operately.People.Person

    field :kpi_name, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :kpi_id, :kpi_name])
  end

  def build(params) do
    changeset(params)
  end
end
