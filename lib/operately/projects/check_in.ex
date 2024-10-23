defmodule Operately.Projects.CheckIn do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "project_check_ins" do
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id, where: [deleted_at: nil]
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    field :status, :string
    field :description, :map

    belongs_to :acknowledged_by, Operately.People.Person, foreign_key: :acknowledged_by_id
    field :acknowledged_at, :utc_datetime

    has_one :access_context, through: [:project, :access_context]
    has_many :reactions, Operately.Updates.Reaction, foreign_key: :entity_id, where: [entity_type: :project_check_in]
    has_many :comments, Operately.Updates.Comment, foreign_key: :entity_id, where: [entity_type: :project_check_in]

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true, default: []

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [:author_id, :project_id, :description, :status, :acknowledged_by_id, :acknowledged_at, :subscription_list_id])
    |> validate_required([:author_id, :project_id, :description, :status, :subscription_list_id])
  end

  # After load hooks

  import Ecto.Query, only: [from: 2]

  def load_unread_notifications(check_in = %__MODULE__{}, person) do
    actions = [
      "project_check_in_submitted",
      "project_check_in_acknowledged"
    ]

    notifications =
      from(n in Operately.Notifications.Notification,
        join: a in assoc(n, :activity),
        where: a.action in ^actions and a.content["check_in_id"] == ^check_in.id,
        where: n.person_id == ^person.id and not n.read,
        select: n
      )
      |> Repo.all()

    Map.put(check_in, :notifications, notifications)
  end

  def load_potential_subscribers(check_in = %__MODULE__{}) do
    q = from(c in Operately.Projects.Contributor, join: p in assoc(c, :person), preload: :person)
    tmp_check_in = Repo.preload(check_in, [:access_context, [project: [contributors: q]]], force: true)

    subs =
      tmp_check_in
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_project_child()

    %{check_in | potential_subscribers: subs}
  end
end
