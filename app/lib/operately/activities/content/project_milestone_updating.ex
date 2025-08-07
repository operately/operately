defmodule Operately.Activities.Content.ProjectMilestoneUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :milestone, Operately.Projects.Milestone
    field :old_milestone_name, :string
    field :new_milestone_name, :string
    embeds_one :old_timeframe, Operately.ContextualDates.Timeframe
    embeds_one :new_timeframe, Operately.ContextualDates.Timeframe
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields) -- [:old_timeframe, :new_timeframe])
    |> cast_embed(:old_timeframe)
    |> cast_embed(:new_timeframe)
    |> validate_required([:company_id, :space_id, :project_id, :milestone_id])
  end

  def build(params) do
    changeset(params)
  end
end
