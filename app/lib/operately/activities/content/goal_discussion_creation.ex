defmodule Operately.Activities.Content.GoalDiscussionCreation do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :goal, Operately.Goals.Goal
    belongs_to :discussion, Operately.Messages.Message
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :space_id, :goal_id])
  end

  def build(params) do
    changeset(params)
  end
end
