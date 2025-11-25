defmodule Operately.Projects.Milestone do
  use Operately.Schema
  use Operately.Repo.Getter

  @valid_statuses [:pending, :done]

  schema "project_milestones" do
    belongs_to :project, Operately.Projects.Project
    belongs_to :creator, Operately.People.Person
    has_one :access_context, through: [:project, :access_context]
    has_one :space, through: [:project, :group]

    has_many :tasks, Operately.Tasks.Task

    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

    field :title, :string
    field :status, Ecto.Enum, values: @valid_statuses, default: :pending
    field :phase, Ecto.Enum, values: [:concept, :planning, :execution, :control], default: :concept

    #
    # Deprecated:
    # It should be removed once we are sure that all the migrations have run
    field :deadline_at, :naive_datetime

    embeds_one :timeframe, Operately.ContextualDates.Timeframe, on_replace: :delete
    field :completed_at, :naive_datetime

    field :description, :map
    field :tasks_kanban_state, :map, default: Operately.Tasks.KanbanState.initialize()
    field :tasks_ordering_state, {:array, :string}, default: Operately.Tasks.OrderingState.initialize()

    has_many :comments, Operately.Comments.MilestoneComment

    # populated with after load hooks
    field :permissions, :any, virtual: true
    field :comments_count, :integer, virtual: true
    field :available_statuses, {:array, :map}, virtual: true

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
    |> cast(attrs, [
      :title,
      :project_id,
      :creator_id,
      :deadline_at,
      :status,
      :completed_at,
      :deleted_at,
      :description,
      :tasks_kanban_state,
      :tasks_ordering_state,
      :subscription_list_id
    ])
    |> cast_embed(:timeframe)
    |> validate_required([:title, :tasks_kanban_state, :project_id, :subscription_list_id])
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

  def valid_status, do: @valid_statuses

  #
  # After load hooks
  #

  import Ecto.Query, only: [from: 2]

  def load_comments_count(milestones) do
    milestone_ids = Enum.map(milestones, &(&1.id))

    # Only count comments with action :none (actual comments).
    # Actions :complete and :reopen are milestone status changes, not comments.
    counts =
      from(mc in Operately.Comments.MilestoneComment,
        where: mc.milestone_id in ^milestone_ids and mc.action == :none,
        group_by: mc.milestone_id,
        select: {mc.milestone_id, count(mc.id)}
      )
      |> Operately.Repo.all()
      |> Enum.into(%{})

    Enum.map(milestones, fn m ->
      count = Map.get(counts, m.id, 0)
      Map.put(m, :comments_count, count)
    end)
  end

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

  def preload_available_statuses(milestone = %__MODULE__{}) do
    milestone =
      if Ecto.assoc_loaded?(milestone.project) do
        Operately.Repo.preload(milestone, :project)
      else
        milestone
      end

    statuses = if milestone.project, do: milestone.project.task_statuses || [], else: []

    Map.put(milestone, :available_statuses, statuses)
  end
end
