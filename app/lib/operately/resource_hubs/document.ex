defmodule Operately.ResourceHubs.Document do
  def __api_typename__, do: "resource_hub_document"

  use Operately.Schema
  use Operately.Repo.Getter

  import Ecto.Query, only: [from: 2]

  alias Operately.Notifications
  alias Operately.Repo
  alias Operately.Repo.Getter.Profile
  alias Operately.ResourceHubs.{DocumentVersion, Parent}
  alias Operately.StateMachine

  @valid_states [:draft, :published]

  schema "resource_documents" do
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
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :resource_hub_document], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :resource_hub_document], foreign_key: :entity_id
    has_many :versions, DocumentVersion, foreign_key: :document_id

    field :name, :string
    field :content, :map
    field :current_version, :integer, default: 1
    field :state, Ecto.Enum, values: @valid_states
    field :published_at, :utc_datetime

    # populated with after load hooks
    field :access_context, :any, virtual: true
    field :potential_subscribers, :any, virtual: true
    field :permissions, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :comments_count, :integer, virtual: true
    field :versions_count, :integer, virtual: true
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
    |> cast(attrs, [:node_id, :author_id, :subscription_list_id, :name, :content, :current_version, :state, :published_at])
    |> StateMachine.cast_and_validate(:state, %{
      initial: :draft,
      states: [
        %{name: :draft, allow_transition_to: [:published]},
        %{name: :published, on_enter: &set_published_at/1}
      ]
    })
    |> validate_required([:node_id, :author_id, :subscription_list_id, :name, :content])
    |> validate_number(:current_version, greater_than: 0)
  end

  def getter_profile(:default) do
    %Profile{
      scope: &Parent.scope_node_children/1,
      access_contexts: [:space_access_context, :project_access_context, :goal_access_context]
    }
  end

  defp set_published_at(changeset) do
    put_change(changeset, :published_at, Operately.Time.utc_datetime_now())
  end

  def valid_states, do: @valid_states

  #
  # After load hooks
  #

  def load_potential_subscribers(document = %__MODULE__{}) do
    document = Parent.prepare_for_notifications(document)

    subs =
      document
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_resource_hub_child()

    %{document | potential_subscribers: subs}
  end

  def set_permissions(document = %__MODULE__{}, company_read_only \\ false) do
    perms = Operately.ResourceHubs.Permissions.calculate(document.request_info.access_level, company_read_only: company_read_only)
    Map.put(document, :permissions, perms)
  end

  def find_path_to_document(document = %__MODULE__{}) do
    path = Operately.ResourceHubs.Node.find_all_parent_folders(document.id, "resource_documents")

    Map.put(document, :path_to_document, path)
  end

  def load_versions_count(document = %__MODULE__{}) do
    count =
      from(v in DocumentVersion, where: v.document_id == ^document.id, select: count(v.id))
      |> Repo.one()

    %{document | versions_count: count || 0}
  end
end
