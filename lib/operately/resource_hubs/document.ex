defmodule Operately.ResourceHubs.Document do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "resource_documents" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :resource_hub, through: [:node, :resource_hub]
    has_one :access_context, through: [:node, :resource_hub, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :resource_hub_document], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :resource_hub_document], foreign_key: :entity_id

    field :content, :map

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true

    timestamps()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(document, attrs) do
    document
    |> cast(attrs, [:node_id, :author_id, :subscription_list_id, :content])
    |> validate_required([:node_id, :author_id, :subscription_list_id, :content])
  end

  #
  # After load hooks
  #

  def load_potential_subscribers(document = %__MODULE__{}) do
    document = Repo.preload(document, [:access_context, resource_hub: [space: :members]])

    subs =
      document
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_resource_hub_document()

    %{document | potential_subscribers: subs}
  end

  def set_permissions(document = %__MODULE__{}) do
    perms = Operately.ResourceHubs.Permissions.calculate(document.request_info.access_level)
    Map.put(document, :permissions, perms)
  end
end
