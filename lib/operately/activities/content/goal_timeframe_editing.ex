defmodule Operately.Activities.Content.GoalTimeframeEditing do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :space_id, :string
    field :goal_id, :string

    embeds_one :old_timeframe, Operately.Goals.Timeframe
    embeds_one :new_timeframe, Operately.Goals.Timeframe
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:goal_id, :company_id, :space_id])
    |> cast_embed(:old_timeframe)
    |> cast_embed(:new_timeframe)
    |> validate_required([:goal_id, :company_id, :space_id, :old_timeframe, :new_timeframe])
  end

  def build(params) do
    changeset(params)
  end
end
