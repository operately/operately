defmodule Operately.Activities.Content.GoalReviewerUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :goal, Operately.Goals.Goal
    belongs_to :old_reviewer, Operately.People.Person
    belongs_to :new_reviewer, Operately.People.Person
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields) -- [:old_reviewer_id, :new_reviewer_id])
  end

  def build(params) do
    changeset(params)
  end
end
