defmodule Operately.ProjectTemplates.ResourceFile do
  def __api_typename__, do: "project_template_resource_file"

  use Operately.Schema

  alias Operately.ProjectTemplates.ResourceNode

  schema "project_template_resource_files" do
    belongs_to :node, ResourceNode
    belongs_to :author, Operately.People.Person
    belongs_to :blob, Operately.Blobs.Blob
    belongs_to :preview_blob, Operately.Blobs.Blob

    field :name, :string
    field :description, :map

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(file, attrs) do
    file
    |> cast(attrs, [:node_id, :author_id, :blob_id, :preview_blob_id, :name, :description])
    |> validate_required([:node_id, :blob_id, :name])
  end
end
