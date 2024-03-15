defmodule Operately.Activities.Content.GoalReparent do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :old_parent_goal_id, :string
    field :new_parent_goal_id, :string
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
