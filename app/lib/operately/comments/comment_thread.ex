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
    field :project, :any, virtual: true
    field :space, :any, virtual: true
    field :notifications, :any, virtual: true
    field :can_comment, :boolean, virtual: true
    field :comments_count, :any, virtual: true

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

  def set_potential_subscribers(thread = %__MODULE__{}) do
    project = Operately.Repo.preload(thread.project, contributors: :person)
    thread = Operately.Repo.preload(thread, :access_context)

    thread = Map.put(thread, :project, project)

    subs =
      thread
      |> Notifications.SubscribersLoader.preload_subscriptions()
      |> Notifications.Subscriber.from_project_child()

    Map.put(thread, :potential_subscribers, subs)
  end

  def set_potential_subscribers(activity = %Operately.Activities.Activity{}) do
    cond do
      is_nil(activity.comment_thread) ->
        activity

      activity.content["goal_id"] ->
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

      activity.content["project_id"] ->
        project =
          activity.content["project_id"]
          |> Operately.Projects.get_project!()
          |> Repo.preload(contributors: :person)

        subs =
          activity.comment_thread
          |> Repo.preload(:access_context)
          |> Notifications.SubscribersLoader.preload_subscriptions()
          |> then(fn thread -> Map.put(thread, :project, project) end)
          |> Notifications.Subscriber.from_project_child()

        comment_thread = Map.put(activity.comment_thread, :potential_subscribers, subs)
        Map.put(activity, :comment_thread, comment_thread)

      true ->
        activity
    end
  end

  def list_for_project(project_id) do
    from(ct in __MODULE__,
      where: ct.parent_type == :project and ct.parent_id == ^project_id,
      order_by: [desc: ct.inserted_at]
    )
    |> Operately.Repo.all()
  end

  def load_unread_notifications(thread, person) do
    if thread.parent_type == :project do
      activity = Repo.preload(thread, :activity).activity

      notifications =
        from(n in Operately.Notifications.Notification,
          where: n.activity_id == ^activity.id,
          where: n.person_id == ^person.id and not n.read,
          select: n
        )
        |> Operately.Repo.all()

      Map.put(thread, :notifications, notifications)
    else
      raise ArgumentError, "Unread notifications can only be loaded for project comment threads"
    end
  end

  def load_project(thread) do
    if thread.parent_type == :project do
      project = Operately.Projects.get_project!(thread.parent_id)
      Map.put(thread, :project, project)
    else
      raise ArgumentError, "Project can only be loaded for project comment threads"
    end
  end

  def load_space(thread) do
    if thread.parent_type == :project do
      thread = ensure_project_loaded(thread)
      space = Operately.Groups.get_group!(thread.project.group_id)
      Map.put(thread, :space, space)
    else
      raise ArgumentError, "Space can only be loaded for project comment threads"
    end
  end

  def load_permissions(thread) do
    if thread.parent_type == :project do
      can_comment = Operately.Projects.Permissions.calculate(thread.request_info.access_level).can_comment
      Map.put(thread, :can_comment, can_comment)
    else
      raise ArgumentError, "Permissions can only be loaded for project comment threads"
    end
  end

  defp ensure_project_loaded(thread) do
    if thread.project do
      thread
    else
      thread = load_project(thread)
      if thread.project, do: thread, else: raise(ArgumentError, "Project could not be loaded")
    end
  end
end
