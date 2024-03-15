defmodule Operately.Activities.Content.GoalReparent do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
  field :old_parent_goal_id, :string
  field :new_goal_parent_id, :string
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
