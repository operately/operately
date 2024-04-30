defmodule Operately.Activities.Content.GoalTimeframeEditing do
  use Operately.Activities.Content

  embedded_schema do
    field :old_timeframe, :string
  field :new_timeframe, :string
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
