defmodule Operately.ResourceHubs.Link do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "resource_links" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :space, through: [:node, :resource_hub, :space]
    has_one :resource_hub, through: [:node, :resource_hub]
    has_one :access_context, through: [:node, :resource_hub, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :resource_hub_link], foreign_key: :entity_id

    field :url, :string
    field :description, :map
    field :type, Ecto.Enum, values: [:google_doc, :other]

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :path_to_link, :any, virtual: true

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

  #
  # After load hooks
  #

  def load_potential_subscribers(link = %__MODULE__{}) do
    link = Repo.preload(link, [:access_context, resource_hub: [space: :members]])

    subs =
      link
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_resource_hub_child()

    %{link | potential_subscribers: subs}
  end

  def set_permissions(link = %__MODULE__{}) do
    perms = Operately.ResourceHubs.Permissions.calculate(link.request_info.access_level)
    Map.put(link, :permissions, perms)
  end

  def find_path_to_link(link = %__MODULE__{}) do
    path = Operately.ResourceHubs.Node.find_all_parent_folders(link.id, "resource_links")

    Map.put(link, :path_to_link, path)
  end
end
