defmodule Operately.ResourceHubs.Folder do
  use Operately.Schema

  schema "resource_folders" do
    belongs_to :node, Operately.ResourceHubs.Node

    field :description, :map
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
