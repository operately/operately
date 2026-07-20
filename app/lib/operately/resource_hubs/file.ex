defmodule Operately.ResourceHubs.File do
  def __api_typename__, do: "resource_hub_file"

  use Operately.Schema

  import Operately.Repo.RequestInfo, only: [request_info: 0]

  alias Operately.Notifications
  alias Operately.ResourceHubs.{Getter, Parent}

  schema "resource_files" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :blob, Operately.Blobs.Blob, foreign_key: :blob_id
    belongs_to :preview_blob, Operately.Blobs.Blob, foreign_key: :preview_blob_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :space, through: [:node, :resource_hub, :space]
    has_one :project, through: [:node, :resource_hub, :project]
    has_one :goal, through: [:node, :resource_hub, :goal]
    has_one :resource_hub, through: [:node, :resource_hub]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :resource_hub_file], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :resource_hub_file], foreign_key: :entity_id

    field :name, :string
    field :description, :map

    # populated with after load hooks
    field :access_context, :any, virtual: true
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true
    field :comments_count, :integer, virtual: true
    field :path_to_file, :any, virtual: true

    timestamps()
    soft_delete()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(file, attrs) do
    file
    |> cast(attrs, [:node_id, :author_id, :blob_id, :preview_blob_id, :name, :description, :subscription_list_id])
    |> validate_required([:node_id, :author_id, :blob_id, :name, :subscription_list_id])
  end

  def get(requester, args) do
    Getter.get(__MODULE__, requester, args, :node_child)
  end

  def get!(requester, args) do
    case get(requester, args) do
      {:ok, resource} -> resource
      {:error, :not_found} -> raise Ecto.NoResultsError, queryable: __MODULE__
      {:error, reason} -> raise "Failed to get #{__MODULE__}: #{inspect(reason)}"
    end
  end

  #
  # After load hooks
  #

  def load_potential_subscribers(file = %__MODULE__{}) do
    file = Parent.prepare_for_notifications(file)

    subs =
      file
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_resource_hub_child()

    %{file | potential_subscribers: subs}
  end

  def set_permissions(file = %__MODULE__{}, company_read_only \\ false) do
    perms = Operately.ResourceHubs.Permissions.calculate(file.request_info.access_level, company_read_only: company_read_only)
    Map.put(file, :permissions, perms)
  end

  def find_path_to_file(file = %__MODULE__{}) do
    path = Operately.ResourceHubs.Node.find_all_parent_folders(file.id, "resource_files")

    Map.put(file, :path_to_file, path)
  end
end
