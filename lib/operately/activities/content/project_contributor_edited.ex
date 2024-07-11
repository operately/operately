defmodule Operately.Activities.Content.ProjectContributorEdited do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project

    belongs_to :previous_contributor, Operately.People.Person
    field :previous_role, :string

    belongs_to :new_contributor, Operately.People.Person
    field :new_role, :string
    field :new_permissions, :integer
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
