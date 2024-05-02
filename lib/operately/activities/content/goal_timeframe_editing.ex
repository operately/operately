defmodule Operately.Activities.Content.GoalTimeframeEditing do
  use Operately.Activities.Content

  embedded_schema do
    embeds_one :old_timeframe, Operately.Goals.Timeframe
    embeds_one :new_timeframe, Operately.Goals.Timeframe
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [])
    |> cast_embed(:old_timeframe)
    |> cast_embed(:new_timeframe)
  end

  def build(params) do
    changeset(params)
  end
end
