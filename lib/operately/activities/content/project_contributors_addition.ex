defmodule Operately.Activities.Content.ProjectContributorsAddition do
  use Operately.Activities.Content

  defmodule Contributor do
    use Operately.Activities.Content

    embedded_schema do
      belongs_to :person, Operately.People.Person

      field :role, :string
      field :responsibility, :string
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project

    embeds_many :contributors, Contributor
  end

  def changeset(attrs) do
    %__MODULE__{} 
    |> cast(attrs, [:company_id, :project_id, :space_id])
  end

  def build(params) do
    changeset(params)
  end
end
