defmodule Operately.ResourceHubs.Document do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "resource_documents" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id
    has_one :access_context, through: [:node, :resource_hub, :access_context]

    field :content, :map

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
    |> cast(attrs, [:node_id, :subscription_list_id, :content])
    |> validate_required([:node_id, :content])
  end
end
