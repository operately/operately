defmodule Operately.Projects.Retrospective do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "project_retrospectives" do
    belongs_to :author, Operately.People.Person
    belongs_to :project, Operately.Projects.Project
    belongs_to :subscription_list, Notifications.SubscriptionList

    has_one :access_context, through: [:project, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :project_retrospective], foreign_key: :entity_id

    field :content, :map

    # populated with after load hooks
    field :permissions, :any, virtual: true
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true, default: []

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(retrospective, attrs) do
    retrospective
    |> cast(attrs, [:author_id, :project_id, :subscription_list_id, :content])
    |> validate_required([:author_id, :project_id, :subscription_list_id, :content])
  end

  #
  # After load hooks
  #

  def set_permissions(retrospective = %__MODULE__{}) do
    perms = Operately.Projects.Permissions.calculate(retrospective.request_info.access_level)
    Map.put(retrospective, :permissions, perms)
  end

  def load_potential_subscribers(retrospective = %__MODULE__{}) do
    q = from(c in Operately.Projects.Contributor, join: p in assoc(c, :person), preload: :person)
    tmp_retrospective = Repo.preload(retrospective, [:access_context, [project: [contributors: q]]], force: true)

    subs =
      tmp_retrospective
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_project_child()

    %{retrospective | potential_subscribers: subs}
  end
end
