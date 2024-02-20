defmodule Operately.Activities.Content.TaskUpdate do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :task_id, :string

    field :old_name, :string
    field :new_name, :string
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
