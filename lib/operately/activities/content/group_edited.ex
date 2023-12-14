defmodule Operately.Activities.Content.GroupEdited do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :group_id, :string
    field :old_name, :string
    field :old_mission, :string
    field :new_name, :string
    field :new_mission, :string
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
