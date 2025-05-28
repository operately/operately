defmodule Operately.Activities.Content.GoalDueDateChanged do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :goal, Operately.Goals.Goal

    field :old_due_date, :date
    field :new_due_date, :date
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields) -- [:old_due_date, :new_due_date])
  end

  def build(params) do
    changeset(params)
  end
end
