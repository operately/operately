defmodule Operately.ProjectTemplates.ResourceNode do
  def __api_typename__, do: "project_template_resource_node"

  use Operately.Schema

  alias Operately.ProjectTemplates.{ProjectTemplate, ResourceDocument, ResourceFile, ResourceFolder, ResourceLink}

  schema "project_template_resource_nodes" do
    belongs_to :project_template, ProjectTemplate
    belongs_to :parent_folder, ResourceFolder

    has_one :folder, ResourceFolder, foreign_key: :node_id
    has_one :document, ResourceDocument, foreign_key: :node_id
    has_one :file, ResourceFile, foreign_key: :node_id
    has_one :link, ResourceLink, foreign_key: :node_id

    field :type, Ecto.Enum, values: [:folder, :document, :file, :link]
    field :position, :integer

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(node, attrs) do
    node
    |> cast(attrs, [:project_template_id, :parent_folder_id, :type, :position])
    |> validate_required([:project_template_id, :type, :position])
    |> validate_number(:position, greater_than_or_equal_to: 0)
  end
end
