defmodule Operately.Activities.Content.ProjectDescriptionChanged do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project

    field :project_name, :string
    field :has_description, :boolean
    field :description, :map
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [
      :company_id,
      :space_id,
      :project_id,
      :project_name,
      :has_description,
      :description
    ])
    |> validate_required([
      :company_id,
      :space_id,
      :project_id,
      :project_name,
      :has_description,
      :description
    ])
  end

  def build(params) do
    changeset(params)
  end
end
