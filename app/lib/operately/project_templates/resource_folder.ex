defmodule Operately.ProjectTemplates.ResourceFolder do
  def __api_typename__, do: "project_template_resource_folder"

  use Operately.Schema

  alias Operately.ProjectTemplates.ResourceNode

  schema "project_template_resource_folders" do
    belongs_to :node, ResourceNode
    has_many :child_nodes, ResourceNode, foreign_key: :parent_folder_id

    field :name, :string

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(folder, attrs) do
    folder
    |> cast(attrs, [:node_id, :name])
    |> validate_required([:node_id, :name])
  end
end
