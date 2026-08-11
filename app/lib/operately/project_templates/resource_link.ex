defmodule Operately.ProjectTemplates.ResourceLink do
  def __api_typename__, do: "project_template_resource_link"

  use Operately.Schema

  alias Operately.ProjectTemplates.ResourceNode

  @valid_types [:airtable, :dropbox, :figma, :google, :google_doc, :google_sheet, :google_slides, :notion, :other]

  schema "project_template_resource_links" do
    belongs_to :node, ResourceNode
    belongs_to :author, Operately.People.Person

    field :name, :string
    field :url, :string
    field :description, :map
    field :type, Ecto.Enum, values: @valid_types

    timestamps()
  end

  def changeset(attrs), do: changeset(%__MODULE__{}, attrs)

  def changeset(link, attrs) do
    link
    |> cast(attrs, [:node_id, :author_id, :name, :url, :description, :type])
    |> validate_required([:node_id, :name, :url, :type])
  end

  def valid_types, do: @valid_types
end
