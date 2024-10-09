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
    field :closed_at, :utc_datetime

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
    |> cast(attrs, [:author_id, :project_id, :subscription_list_id, :content, :closed_at])
    |> validate_required([:author_id, :project_id, :subscription_list_id, :content, :closed_at])
  end

  #
  # After load hooks
  #

  def load_unread_notifications(retrospective = %__MODULE__{}, person) do
    actions = [
      "project_closed",
    ]

    notifications =
      from(n in Operately.Notifications.Notification,
        join: a in assoc(n, :activity),
        where: a.action in ^actions and a.content["retrospective_id"] == ^retrospective.id,
        where: n.person_id == ^person.id and not n.read,
        preload: :activity,
        select: n
      )
      |> Repo.all()

    Map.put(retrospective, :notifications, notifications)
  end

  def set_permissions(retrospective = %__MODULE__{}) do
    perms = Operately.Projects.Permissions.calculate(retrospective.request_info.access_level)
    Map.put(retrospective, :permissions, perms)
  end

  def set_potential_subscribers(retrospective = %__MODULE__{}) do
    subs =
      retrospective
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_project_child()

    %{retrospective | potential_subscribers: subs}
  end
end
