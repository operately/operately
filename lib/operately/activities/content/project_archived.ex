defmodule Operately.Activities.Content.ProjectArchived do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :project, Operately.Projects.Project
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    project = Operately.Projects.get_project!(params["project_id"])

    changeset(%{
      company_id: project.company_id,
      project_id: project.id
    })
  end
end
