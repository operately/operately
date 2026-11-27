defmodule Operately.Messages.Message do
  def __api_typename__, do: "discussion"

  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications
  alias Operately.Repo.Getter.Profile
  alias Operately.StateMachine
  import Ecto.Query, only: [from: 2]

  @valid_states [:draft, :scheduled, :published]
  @owners [:messages_board_id, :project_id, :goal_id]

  schema "messages" do
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :messages_board, Operately.Messages.MessagesBoard, foreign_key: :messages_board_id
    belongs_to :project, Operately.Projects.Project
    belongs_to :goal, Operately.Goals.Goal
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :space, through: [:messages_board, :space]
    has_one :access_context, through: [:messages_board, :space, :access_context]
    has_one :project_access_context, through: [:project, :access_context]
    has_one :goal_access_context, through: [:goal, :access_context]
    has_many :reactions, Operately.Updates.Reaction, where: [entity_type: :message], foreign_key: :entity_id
    has_many :comments, Operately.Updates.Comment, where: [entity_type: :message], foreign_key: :entity_id

    field :title
    field :body, :map
    field :state, Ecto.Enum, values: @valid_states
    field :published_at, :utc_datetime
    field :scheduled_at, :utc_datetime

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :permissions, :any, virtual: true
    field :comments_count, :any, virtual: true

    timestamps()
    requester_access_level()
    request_info()
    soft_delete()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, @owners ++ [:author_id, :title, :body, :subscription_list_id, :state, :published_at, :scheduled_at, :inserted_at])
    |> StateMachine.cast_and_validate(:state, %{
      initial: :draft,
      states: [
        %{name: :draft, allow_transition_to: [:scheduled, :published]},
        %{name: :scheduled, allow_transition_to: [:draft, :published]},
        %{name: :published, allow_transition_to: [], on_enter: &set_published_at/1}
      ]
    })
    |> validate_required([:author_id, :title, :body, :subscription_list_id, :state])
    |> validate_owner()
    |> check_constraint(:messages_board_id, name: :messages_exactly_one_owner)
    |> foreign_key_constraint(:project_id)
    |> foreign_key_constraint(:goal_id)
  end

  def getter_profile(:default), do: %Profile{access_contexts: [:access_context, :project_access_context, :goal_access_context]}
  def getter_profile(:space_discussion), do: %Profile{scope: &board_owned/1}
  def getter_profile(_), do: nil

  defp board_owned(query), do: from(m in query, where: not is_nil(m.messages_board_id))

  defp validate_owner(changeset) do
    if Enum.count(@owners, &(!is_nil(get_field(changeset, &1)))) == 1 do
      changeset
    else
      add_error(changeset, :messages_board_id, "exactly one of messages_board_id, project_id, or goal_id must be present")
    end
  end

  defp set_published_at(changeset) do
    put_change(changeset, :published_at, Operately.Time.utc_datetime_now())
  end

  def valid_states, do: @valid_states

  #
  # After load hooks
  #

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

  def set_permissions(message = %__MODULE__{}, company_read_only \\ false) do
    perms = Operately.Groups.Permissions.calculate_permissions(message.request_info.access_level, company_read_only: company_read_only)
    Map.put(message, :permissions, perms)
  end
end
