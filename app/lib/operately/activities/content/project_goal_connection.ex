defmodule Operately.Activities.Content.ProjectGoalConnection do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :goal, Operately.Goals.Goal
    belongs_to :previous_goal, Operately.Goals.Goal

    field :goal_name, :string
    field :previous_goal_name, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :project_id])
  end

  def build(params) do
    changeset(params)
  end
end
