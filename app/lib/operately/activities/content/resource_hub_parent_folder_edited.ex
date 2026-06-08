defmodule Operately.Activities.Content.ResourceHubParentFolderEdited do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    belongs_to :node, Operately.ResourceHubs.Node
    belongs_to :new_folder, Operately.ResourceHubs.Folder

    field :resource_id, :string
    field :resource_type, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :resource_hub_id, :node_id, :resource_id, :resource_type])
    |> validate_parent()
  end

  def build(params) do
    changeset(params)
  end

  defp validate_parent(changeset) do
    if get_field(changeset, :space_id) || get_field(changeset, :project_id), do: changeset, else: add_error(changeset, :base, "space_id or project_id is required")
  end
end
