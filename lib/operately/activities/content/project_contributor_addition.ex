defmodule Operately.Activities.Content.ProjectContributorAddition do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :project, Operately.Projects.Project
    belongs_to :person, Operately.People.Person
    belongs_to :contributor, Operately.Projects.Contributor

    field :responsibility, :string
    field :role, :string
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
