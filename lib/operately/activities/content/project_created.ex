defmodule Operately.Activities.Content.ProjectCreated do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :integer
    field :project_id, :integer
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(_context, project) do
    changeset(%{
      company_id: project.company_id, 
      project_id: project.id
    })
  end
end
