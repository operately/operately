defmodule Operately.ResourceHubs.Folder do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "resource_folders" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id

    has_one :access_context, through: [:node, :resource_hub, :access_context]
    has_many :child_nodes, Operately.ResourceHubs.Node, foreign_key: :parent_folder_id

    field :description, :map

    # populated with after load hooks
    field :permissions, :any, virtual: true

    timestamps()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(folder, attrs) do
    folder
    |> cast(attrs, [:node_id, :description])
    |> validate_required([:node_id])
  end
end
