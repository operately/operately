defmodule Operately.Activities.Activity do
  use Operately.Schema
  use Operately.Repo.Getter

  @deprecated_actions [
    "project_status_update_acknowledged",
    "project_status_update_commented",
    "project_status_update_edit",
    "project_status_update_submitted",
    "project_review_submitted",
    "project_review_request_submitted",
    "project_review_acknowledged",
    "project_review_commented",
    "project_discussion_comment_submitted"
  ]

  schema "activities" do
    belongs_to :author, Operately.People.Person
    belongs_to :comment_thread, Operately.Comments.CommentThread

    belongs_to :access_context, Operately.Access.Context, foreign_key: :access_context_id

    field :action, :string
    field :content, :map

    field :resource_id, :binary_id
    field :resource_type, :string

    # populated with after load hooks
    field :notifications, :any, virtual: true, default: []
    field :permissions, :any, virtual: true

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(activity, attrs) do
    activity |> cast(attrs, [:author_id, :action, :content, :comment_thread_id, :access_context_id])
  end

  def deprecated_actions, do: @deprecated_actions

  #
  # After load hooks
  #

  def load_unread_goal_notifications(activity = %__MODULE__{}, person) do
    actions = [
      "goal_closing",
      "goal_reopening",
      "goal_timeframe_editing",
      "goal_discussion_creation",
    ]

    if Enum.member?(actions, activity.action) do
      notifications =
        from(n in Operately.Notifications.Notification,
          where: n.activity_id == ^activity.id,
          where: n.person_id == ^person.id and not n.read,
          select: n
        )
        |> Repo.all()

      Map.put(activity, :notifications, notifications)
    else
      activity
    end
  end

  def set_permissions(activity) do
    permissions = Operately.Activities.Permissions.calculate_permissions(activity.request_info.access_level)
    Map.put(activity, :permissions, permissions)
  end
end
