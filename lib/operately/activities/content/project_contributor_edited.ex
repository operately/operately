defmodule Operately.Activities.Content.ProjectContributorEdited do
  use Operately.Activities.Content

  defmodule Contributor do
    use Operately.Activities.Content

    embedded_schema do
      field :person_id, :string
      field :role, :string
      field :permissions, :integer
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project

    embeds_one :previous_contributor, Contributor
    embeds_one :updated_contributor, Contributor
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id])
    |> cast_embed(:previous_contributor)
    |> cast_embed(:updated_contributor)
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    changeset(params)
  end
end
