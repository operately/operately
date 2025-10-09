defmodule Operately.Activities.Content.GoalDescriptionChanged do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :goal, Operately.Goals.Goal

    field :goal_name, :string
    field :old_description, :map
    field :new_description, :map
    field :has_description, :boolean
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields) -- [:old_description])
  end

  def build(params) do
    changeset(params)
  end
end
