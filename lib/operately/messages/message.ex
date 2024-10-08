defmodule Operately.Messages.Message do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "messages" do
    belongs_to :space, Operately.Groups.Group
    belongs_to :author, Operately.People.Person
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :access_context, through: [:space, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :message], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :message], foreign_key: :entity_id

    field :title
    field :body, :map

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(update, attrs) do
    update
    |> cast(attrs, [:space_id, :author_id, :title, :body, :subscription_list_id])
    |> validate_required([:space_id, :author_id, :title, :body, :subscription_list_id])
  end

  #
  # After load hooks
  #

  import Ecto.Query, only: [from: 2]

  def load_unread_notifications(message = %__MODULE__{}, person) do
    notifications =
      from(n in Operately.Notifications.Notification,
        join: a in assoc(n, :activity),
        where: a.action == "discussion_posting" and a.content["discussion_id"] == ^message.id,
        where: n.person_id == ^person.id and not n.read,
        select: n
      )
      |> Repo.all()

    Map.put(message, :notifications, notifications)
  end

  def set_potential_subscribers(message = %__MODULE__{}) do
    subs =
      message
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_message()

    %{message | potential_subscribers: subs}
  end
end
