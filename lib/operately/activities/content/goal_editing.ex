defmodule Operately.Activities.Content.GoalEditing do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
  field :goal_id, :string
  field :old_name, :string
  field :new_name, :string
  field :old_timeframe, :string
  field :new_timeframe, :string
  field :old_champion_id, :string
  field :new_champion_id, :string
  field :old_reviewer_id, :string
  field :new_reviewer_id, :string
  field :added_targets, :string
  field :updated_targets, :string
  field :removed_targets, :string
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
