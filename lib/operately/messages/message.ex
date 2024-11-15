defmodule Operately.Messages.Message do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "messages" do
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :messages_board, Operately.Messages.MessagesBoard, foreign_key: :messages_board_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :space, through: [:messages_board, :space]
    has_one :access_context, through: [:messages_board, :space, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :message], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :message], foreign_key: :entity_id

    field :title
    field :body, :map
    field :state, Ecto.Enum, values: [:draft, :published], default: :published
    field :published_at, :utc_datetime

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :permissions, :any, virtual: true
    field :comments_count, :any, virtual: true

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(update, attrs) do
    update
    |> cast(attrs, [:messages_board_id, :author_id, :title, :body, :subscription_list_id, :state, :published_at])
    |> validate_required([:messages_board_id, :author_id, :title, :body, :subscription_list_id, :state])
    |> validate_state_change()
    |> set_published_at()
  end

  defp validate_state_change(changeset) do
    case state_change(changeset) do
      [from: :published, to: :draft] ->
        add_error(changeset, :state, "invalid state change")
      _ -> 
        changeset
    end
  end

  defp set_published_at(changeset) do
    case state_change(changeset) do
      [from: :published, to: :published] ->
        changeset
      [from: _, to: :published] ->
        put_change(changeset, :published_at, NaiveDateTime.utc_now())
      _ -> 
        changeset
    end
  end

  defp state_change(changeset) do
    [from: get_field(changeset, :state), to: get_change(changeset, :state)]
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

  def load_comments_count(messages) do
    message_ids = Enum.map(messages, &(&1.id))

    counts =
      from(c in Operately.Updates.Comment,
        where: c.entity_id in ^message_ids,
        group_by: c.entity_id,
        select: {c.entity_id, count(c.id)}
      )
      |> Repo.all()
      |> Enum.into(%{})

    Enum.map(messages, fn m ->
      count = Map.get(counts, m.id, 0)
      Map.put(m, :comments_count, count)
    end)
  end

  def set_potential_subscribers(message = %__MODULE__{}) do
    subs =
      message
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_message()

    %{message | potential_subscribers: subs}
  end

  def set_permissions(message = %__MODULE__{}) do
    perms = Operately.Groups.Permissions.calculate_permissions(message.request_info.access_level)
    Map.put(message, :permissions, perms)
  end
end
