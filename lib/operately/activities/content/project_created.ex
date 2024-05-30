defmodule Operately.Activities.Content.ProjectCreated do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :project, Operately.Projects.Project
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :project_id])
    |> validate_required([:company_id, :project_id])
  end

  def build(params) do
    changeset(params)
  end

  # def references do
  #   [
  #     {:company, :company_id, Operately.Companies.Company, :id},
  #     {:project, :project_id, Operately.Projects.Project, :id}
  #   ]
  # end
end
