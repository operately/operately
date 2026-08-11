defmodule Operately.ProjectTemplates.ResourceDocument do
  def __api_typename__, do: "project_template_resource_document"

  use Operately.Schema

  alias Operately.ProjectTemplates.ResourceNode

  schema "project_template_resource_documents" do
    belongs_to :node, ResourceNode
    belongs_to :author, Operately.People.Person

    field :name, :string
    field :content, :map

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(document, attrs) do
    document
    |> cast(attrs, [:node_id, :author_id, :name, :content])
    |> validate_required([:node_id, :name, :content])
  end
end
