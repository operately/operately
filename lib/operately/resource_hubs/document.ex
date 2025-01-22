defmodule Operately.ResourceHubs.Document do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications
  alias Operately.StateMachine

  schema "resource_documents" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :space, through: [:node, :resource_hub, :space]
    has_one :resource_hub, through: [:node, :resource_hub]
    has_one :access_context, through: [:node, :resource_hub, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :resource_hub_document], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :resource_hub_document], foreign_key: :entity_id

    field :content, :map
    field :state, Ecto.Enum, values: [:draft, :published]
    field :published_at, :utc_datetime

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :comments_count, :integer, virtual: true
    field :path_to_document, :any, virtual: true

    timestamps()
    soft_delete()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(document, attrs) do
    document
    |> cast(attrs, [:node_id, :author_id, :subscription_list_id, :content, :state, :published_at])
    |> StateMachine.cast_and_validate(:state, %{
      initial: :draft,
      states: [
        %{name: :draft, allow_transition_to: [:published]},
        %{name: :published, on_enter: &set_published_at/1}
      ]
    })
    |> validate_required([:node_id, :author_id, :subscription_list_id, :content])
  end

  defp set_published_at(changeset) do
    put_change(changeset, :published_at, Operately.Time.utc_datetime_now())
  end

  #
  # After load hooks
  #

  def load_potential_subscribers(document = %__MODULE__{}) do
    document = Repo.preload(document, [:access_context, resource_hub: [space: :members]])

    subs =
      document
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_resource_hub_child()

    %{document | potential_subscribers: subs}
  end

  def set_permissions(document = %__MODULE__{}) do
    perms = Operately.ResourceHubs.Permissions.calculate(document.request_info.access_level)
    Map.put(document, :permissions, perms)
  end

  def find_path_to_document(document = %__MODULE__{}) do
    path = Operately.ResourceHubs.Node.find_all_parent_folders(document.id, "resource_documents")

    Map.put(document, :path_to_document, path)
  end
end
