defmodule Operately.Activities.Content.GoalCheckInEdit do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :goal, Operately.Goals.Goal
    belongs_to :check_in, Operately.Goals.Update

    embeds_one :old_timeframe, Operately.ContextualDates.Timeframe
    embeds_one :new_timeframe, Operately.ContextualDates.Timeframe
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :goal_id, :check_in_id])
    |> cast_embed(:old_timeframe)
    |> cast_embed(:new_timeframe)
    |> validate_required([:company_id, :goal_id, :check_in_id])
  end

  def build(params) do
    changeset(params)
  end
end
