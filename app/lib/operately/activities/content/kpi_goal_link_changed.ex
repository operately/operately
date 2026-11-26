defmodule Operately.Activities.Content.KpiGoalLinkChanged do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :kpi, Operately.Kpis.Kpi

    field :kpi_name, :string
    field :linked_goal_id, :string
    field :linked, :boolean
  end

  def changeset(attrs) do
    cast_all_fields(attrs)
    |> validate_required([:company_id, :space_id, :kpi_id, :kpi_name, :linked_goal_id, :linked])
  end

  def build(attrs), do: changeset(attrs)
end
