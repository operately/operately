defmodule Operately.ResourceHubs.File do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "resource_files" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :blob, Operately.Blobs.Blob, foreign_key: :blob_id
    belongs_to :preview_blob, Operately.Blobs.Blob, foreign_key: :preview_blob_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :space, through: [:node, :resource_hub, :space]
    has_one :resource_hub, through: [:node, :resource_hub]
    has_one :access_context, through: [:node, :resource_hub, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :resource_hub_file], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :resource_hub_file], foreign_key: :entity_id

    field :description, :map

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true
    field :comments_count, :integer, virtual: true

    timestamps()
    soft_delete()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(file, attrs) do
    file
    |> cast(attrs, [:node_id, :author_id, :blob_id, :preview_blob_id, :description, :subscription_list_id])
    |> validate_required([:node_id, :author_id, :blob_id, :subscription_list_id])
  end

  #
  # After load hooks
  #

  def load_potential_subscribers(file = %__MODULE__{}) do
    file = Repo.preload(file, [:access_context, resource_hub: [space: :members]])

    subs =
      file
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_resource_hub_child()

    %{file | potential_subscribers: subs}
  end

  def set_permissions(file = %__MODULE__{}) do
    perms = Operately.ResourceHubs.Permissions.calculate(file.request_info.access_level)
    Map.put(file, :permissions, perms)
  end
end
