defmodule Operately.Activities.Content.ProjectRenamed do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :project, Operately.Projects.Project

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
