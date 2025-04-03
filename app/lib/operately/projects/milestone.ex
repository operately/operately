defmodule Operately.Projects.Milestone do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "project_milestones" do
    belongs_to :project, Operately.Projects.Project
    has_one :access_context, through: [:project, :access_context]

    has_many :tasks, Operately.Tasks.Task

    field :title, :string
    field :status, Ecto.Enum, values: [:pending, :done], default: :pending
    field :phase, Ecto.Enum, values: [:concept, :planning, :execution, :control], default: :concept

    field :deadline_at, :naive_datetime
    field :completed_at, :naive_datetime

    field :description, :map
    field :tasks_kanban_state, :map, default: Operately.Tasks.KanbanState.initialize()

    has_many :comments, Operately.Comments.MilestoneComment

    # populated with after load hooks
    field :permissions, :any, virtual: true

    timestamps()
    soft_delete()
    request_info()
    requester_access_level()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(milestone, attrs) do
    milestone
    |> cast(attrs, [:title, :deadline_at, :project_id, :status, :completed_at, :deleted_at, :description, :tasks_kanban_state])
    |> validate_required([:title, :tasks_kanban_state, :project_id])
  end

  def set_status(milestone, :pending) do
    milestone
    |> changeset(%{status: :pending, completed_at: nil})
    |> Operately.Repo.update()
  end

  def set_status(milestone, :done) do
    milestone
    |> changeset(%{status: :done, completed_at: DateTime.utc_now()})
    |> Operately.Repo.update()
  end

  #
  # After load hooks
  #

  def set_permissions(milestone = %__MODULE__{}) do
    perms = Operately.Projects.Permissions.calculate(milestone.request_info.access_level)
    Map.put(milestone, :permissions, perms)
  end

  def load_comment_notifications(person) do
    fn milestone ->
      comment_ids = Enum.map(milestone.comments, &(&1.comment_id))

      notifications_map =
        from(n in Operately.Notifications.Notification,
          join: a in assoc(n, :activity),
          where: a.action == "project_milestone_commented",
          where: a.content["comment_id"] in ^comment_ids,
          where: n.person_id == ^person.id,
          where: not n.read,
          select: {a.content["comment_id"], n}
        )
        |> Repo.all()
        |> Map.new()

      comments =
        Enum.map(milestone.comments, fn comment ->
          case Map.get(notifications_map, comment.comment_id) do
            nil -> comment
            notification ->
              milestone_comment = Map.put(comment.comment, :notification, notification)
              Map.put(comment, :comment, milestone_comment)
          end
        end)

      Map.put(milestone, :comments, comments)
    end
  end
end
