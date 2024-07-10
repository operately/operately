defmodule Operately.Activities.Content.ProjectPermissionsEdited do
  use Operately.Activities.Content

  defmodule Permissions do
    use Operately.Activities.Content

    embedded_schema do
      field :public, :integer
      field :company, :integer
      field :space, :integer
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, [:public, :company, :space])
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project

    embeds_one :previous_permissions, Permissions
    embeds_one :new_permissions, Permissions
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id])
    |> cast_embed(:previous_permissions)
    |> cast_embed(:new_permissions)
    |> validate_required([:company_id, :space_id, :project_id, :previous_permissions, :new_permissions])
  end

  def build(params) do
    changeset(params)
  end
end
