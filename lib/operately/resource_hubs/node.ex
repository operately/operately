defmodule Operately.ResourceHubs.Node do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "resource_nodes" do
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    belongs_to :parent_folder, Operately.ResourceHubs.Folder, foreign_key: :parent_folder_id

    field :name, :string
    field :type, Ecto.Enum, values: [:document, :folder, :file, :link]

    has_one :access_context, through: [:resource_hub, :access_context]
    has_one :folder, Operately.ResourceHubs.Folder, foreign_key: :node_id
    has_one :document, Operately.ResourceHubs.Document, foreign_key: :node_id
    has_one :file, Operately.ResourceHubs.File, foreign_key: :node_id

    timestamps()
    soft_delete()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(node, attrs) do
    node
    |> cast(attrs, [:resource_hub_id, :parent_folder_id, :name, :type])
    |> validate_required([:resource_hub_id, :name, :type])
  end
end
