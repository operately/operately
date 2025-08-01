defmodule Operately.Activities.Content.GoalCreated do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :creator, Operately.People.Person
    belongs_to :champion, Operately.People.Person
    belongs_to :reviewer, Operately.People.Person
    belongs_to :space, Operately.Groups.Group
    belongs_to :goal, Operately.Goals.Goal

    field :goal_name, :string

    # deprecated, use new_timeframe instead
    field :timeframe, :string
    embeds_one :new_timeframe, Operately.ContextualDates.Timeframe
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields) -- [:new_timeframe])
    |> cast_embed(:new_timeframe)
    |> validate_required(__schema__(:fields) -- [:timeframe, :champion_id, :reviewer_id, :new_timeframe])
  end

  def build(params) do
    changeset(params)
  end
end
