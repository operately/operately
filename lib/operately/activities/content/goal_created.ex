defmodule Operately.Activities.Content.GoalCreated do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :creator_id, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :space_id, :string
    field :goal_id, :string
    field :goal_name, :string

    field :timeframe, :string # deprecated, use new_timeframe instead
    embeds_one :new_timeframe, Operately.Goals.Timeframe
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields) -- [:new_timeframe])
    |> cast_embed(:new_timeframe)
    |> validate_required(__schema__(:fields) -- [:timeframe])
  end

  def build(params) do
    changeset(params)
  end
end
