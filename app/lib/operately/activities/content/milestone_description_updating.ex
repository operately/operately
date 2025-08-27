defmodule Operately.Activities.Content.MilestoneDescriptionUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :milestone, Operately.Projects.Milestone
    field :milestone_name, :string
    field :has_description, :boolean
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id, :milestone_id, :milestone_name, :has_description])
    |> validate_required([:company_id, :space_id, :project_id, :milestone_id, :milestone_name, :has_description])
  end

  def build(params) do
    changeset(params)
  end
end
