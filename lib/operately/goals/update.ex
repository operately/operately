defmodule Operately.Goals.Update do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Notifications

  schema "goal_updates" do
    belongs_to :goal, Operately.Goals.Goal, foreign_key: :goal_id
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :subscription_list, Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :access_context, through: [:goal, :access_context]
    has_many :reactions, Operately.Updates.Reaction, foreign_key: :entity_id, where: [entity_type: :goal_update]
    has_many :comments, Operately.Updates.Comment, foreign_key: :entity_id, where: [entity_type: :goal_update]

    field :message, :map
    field :status, Ecto.Enum, values: [:on_track, :caution, :issue, :pending]

    field :acknowledged_at, :utc_datetime
    belongs_to :acknowledged_by, Operately.People.Person, foreign_key: :acknowledged_by_id
    embeds_many :targets, Operately.Goals.Update.Target, on_replace: :delete

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

  def changeset(check_in, attrs) do
    check_in
    |> cast(attrs, [:goal_id, :author_id, :message, :status, :acknowledged_at, :acknowledged_by_id, :subscription_list_id])
    |> cast_embed(:targets)
    |> validate_required([:goal_id, :author_id, :message, :status, :subscription_list_id])
  end

  #
  # After load hooks
  #

  def set_potential_subscribers(update = %__MODULE__{}) do
    subs =
      update
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_goal_update()

    %{update | potential_subscribers: subs}
  end
end
