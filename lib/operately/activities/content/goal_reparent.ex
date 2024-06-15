defmodule Operately.Activities.Content.GoalReparent do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :old_parent_goal, Operately.Goals.Goal
    belongs_to :new_parent_goal, Operately.Goals.Goal
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id])
  end

  def build(params) do
    changeset(params)
  end
end
