defmodule Operately.Activities.Content.MilestoneDueDateUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :milestone, Operately.Projects.Milestone
    field :milestone_name, :string

    embeds_one :old_due_date, Operately.ContextualDates.ContextualDate
    embeds_one :new_due_date, Operately.ContextualDates.ContextualDate
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id, :milestone_id, :milestone_name])
    |> validate_required([:company_id, :space_id, :project_id, :milestone_id, :milestone_name])
    |> cast_embed(:old_due_date)
    |> cast_embed(:new_due_date)
  end

  def build(params) do
    changeset(params)
  end
end
