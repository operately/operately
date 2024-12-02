defmodule Operately.ResourceHubs.File do
  use Operately.Schema

  schema "resource_files" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :blob, Operately.Blobs.Blob, foreign_key: :blob_id
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

    field :description, :map

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(file, attrs) do
    file
    |> cast(attrs, [:node_id, :author_id, :blob_id, :description, :subscription_list_id])
    |> validate_required([:node_id, :author_id, :blob_id, :subscription_list_id])
  end
end
