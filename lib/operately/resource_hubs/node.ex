defmodule Operately.ResourceHubs.Node do
  use Operately.Schema

  schema "resource_nodes" do
    belongs_to :resource_hub, Operately.ResourceHubs.ResourceHub
    belongs_to :folder, Operately.ResourceHubs.Folder

    field :name, :string
    field :type, Ecto.Enum, values: [:folder]

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(node, attrs) do
    node
    |> cast(attrs, [:resource_hub_id, :folder_id, :name, :type])
    |> validate_required([:resource_hub_id, :name, :type])
  end
end
