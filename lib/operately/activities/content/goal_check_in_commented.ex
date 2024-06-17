defmodule Operately.Activities.Content.GoalCheckInCommented do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :goal, Operately.Goals.Goal
    belongs_to :goal_check_in, Operately.Goals.GoalCheckIn
    belongs_to :comment, Operately.Comments.Comment
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    changeset(params)
  end
end
