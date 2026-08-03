defmodule Operately.ResourceHubs.Link do
  def __api_typename__, do: "resource_hub_link"

  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications
  alias Operately.Repo.Getter.Profile
  alias Operately.ResourceHubs.Parent

  @valid_types [:airtable, :dropbox, :figma, :google, :google_doc, :google_sheet, :google_slides, :notion, :other]

  schema "resource_links" do
    belongs_to :node, Operately.ResourceHubs.Node, foreign_key: :node_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :space, through: [:node, :resource_hub, :space]
    has_one :project, through: [:node, :resource_hub, :project]
    has_one :goal, through: [:node, :resource_hub, :goal]
    has_one :resource_hub, through: [:node, :resource_hub]
    has_one :space_access_context, through: [:node, :resource_hub, :space, :access_context]
    has_one :project_access_context, through: [:node, :resource_hub, :project, :access_context]
    has_one :goal_access_context, through: [:node, :resource_hub, :goal, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :resource_hub_link], foreign_key: :entity_id

    field :name, :string
    field :url, :string
    field :description, :map
    field :type, Ecto.Enum, values: @valid_types

    # populated with after load hooks
    field :access_context, :any, virtual: true
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :path_to_link, :any, virtual: true
    field :comments_count, :integer, virtual: true

    timestamps()
    soft_delete()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(link, attrs) do
    link
    |> cast(attrs, [:node_id, :author_id, :subscription_list_id, :name, :url, :description, :type])
    |> validate_required([:node_id, :author_id, :name, :url, :type])
  end

  def getter_profile(:default) do
    %Profile{access_contexts: [:space_access_context, :project_access_context, :goal_access_context]}
  end

  def valid_types, do: @valid_types

  #
  # After load hooks
  #

  def load_potential_subscribers(link = %__MODULE__{}) do
    link = Parent.prepare_for_notifications(link)

    subs =
      link
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_resource_hub_child()

    %{link | potential_subscribers: subs}
  end

  def set_permissions(link = %__MODULE__{}, company_read_only \\ false) do
    perms = Operately.ResourceHubs.Permissions.calculate(link.request_info.access_level, company_read_only: company_read_only)
    Map.put(link, :permissions, perms)
  end

  def find_path_to_link(link = %__MODULE__{}) do
    path = Operately.ResourceHubs.Node.find_all_parent_folders(link.id, "resource_links")

    Map.put(link, :path_to_link, path)
  end
end
