defmodule Operately.Comments.CommentThread do
  use Operately.Schema
  use Operately.Repo.Getter
  alias Operately.Notifications

  schema "comment_threads" do
    belongs_to :author, Operately.People.Person, foreign_key: :author_id
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_many :reactions, Operately.Updates.Reaction, foreign_key: :entity_id, where: [entity_type: :comment_thread]
    has_many :comments, Operately.Updates.Comment, foreign_key: :entity_id, where: [entity_type: :comment_thread]

    has_one :activity, Operately.Activities.Activity, foreign_key: :comment_thread_id
    has_one :access_context, through: [:activity, :access_context]

    field :parent_id, :binary_id
    field :parent_type, Ecto.Enum, values: [:activity, :project]

    field :title, :string
    field :has_title, :boolean, default: false

    field :message, :map

    # populated with after load hooks
    field :potential_subscribers, :any, virtual: true

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(comment_thread, attrs) do
    comment_thread
    |> cast(attrs, [:message, :parent_id, :parent_type, :title, :has_title, :subscription_list_id, :author_id])
    |> validate_required([:message, :parent_id, :parent_type, :subscription_list_id])
    |> validate_required_author_id()
  end

  defp validate_required_author_id(changeset) do
    case get_field(changeset, :parent_type) do
      :project -> validate_required(changeset, [:author_id])
      _ -> changeset
    end
  end

  def set_potential_subscribers(activity) do
    goal =
      activity.content["goal_id"]
      |> Operately.Goals.get_goal()
      |> Repo.preload([:champion, :reviewer, group: :members])

    subs =
      activity.comment_thread
      |> Repo.preload(:access_context)
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_goal_discussion(goal)

    comment_thread = Map.put(activity.comment_thread, :potential_subscribers, subs)
    Map.put(activity, :comment_thread, comment_thread)
  end

  def list_for_project(project_id) do
    from(ct in __MODULE__,
      where: ct.parent_type == :project and ct.parent_id == ^project_id,
      order_by: [desc: ct.inserted_at]
    )
    |> Operately.Repo.all()
  end
end
