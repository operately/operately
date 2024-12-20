defmodule Operately.ResourceHubs.Link do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "resource_links" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :resource_hub, through: [:node, :resource_hub]
    has_one :access_context, through: [:node, :resource_hub, :access_context]

    field :url, :string
    field :description, :map
    field :type, Ecto.Enum, values: [:other]

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true
    field :notifications, :any, virtual: true, default: []

    timestamps()
    soft_delete()
    request_info()
  end

def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(link, attrs) do
    link
    |> cast(attrs, [:node_id, :author_id, :subscription_list_id, :url, :description, :type])
    |> validate_required([:node_id, :author_id, :url, :type])
  end
end
