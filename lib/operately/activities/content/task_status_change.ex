defmodule Operately.Activities.Content.TaskStatusChange do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :task, Operately.Tasks.Task

    field :old_status, :string
    field :new_status, :string
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
