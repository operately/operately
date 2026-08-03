defmodule Operately.Tasks.Task do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Repo.Getter.Profile

  @behaviour Operately.WorkMaps.WorkMapItem

  @type t :: %__MODULE__{
          id: Ecto.UUID.t() | nil,
          name: String.t() | nil,
          priority: String.t() | nil,
          size: String.t() | nil,
          description: map() | nil,
          due_date: %Operately.ContextualDates.ContextualDate{} | nil,
          reminders: [Operately.Tasks.Reminder.t()],
          status: String.t(),
          task_status: Operately.Tasks.Status.t() | nil,
          closed_at: NaiveDateTime.t() | nil,
          reopened_at: NaiveDateTime.t() | nil,
          creator_id: Ecto.UUID.t() | nil,
          milestone_id: Ecto.UUID.t() | nil,
          project_id: Ecto.UUID.t() | nil,
          space_id: Ecto.UUID.t() | nil,
          permissions: map() | nil,
          comments_count: integer() | nil,
          available_statuses: list() | nil,
          inserted_at: NaiveDateTime.t() | nil,
          updated_at: NaiveDateTime.t() | nil
        }

  schema "tasks" do
    belongs_to :creator, Operately.People.Person
    belongs_to :milestone, Operately.Projects.Milestone
    belongs_to :project, Operately.Projects.Project
    belongs_to :space, Operately.Groups.Group
    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

    has_one :project_space, through: [:project, :group]
    has_one :project_access_context, through: [:project, :access_context]
    has_one :space_access_context, through: [:space, :access_context]
    has_one :company, through: [:creator, :company]

    has_many :assignees, Operately.Tasks.Assignee
    has_many :assigned_people, through: [:assignees, :person]

    has_many :comments, Operately.Updates.Comment, where: [entity_type: :project_task], foreign_key: :entity_id

    field :name, :string
    field :priority, :string
    field :size, :string
    field :description, :map

    field :deprecated_due_date, :naive_datetime
    embeds_one :due_date, Operately.ContextualDates.ContextualDate, on_replace: :update
    embeds_many :reminders, Operately.Tasks.Reminder, on_replace: :delete
    field :template_due_offset_days, :integer

    embeds_one :task_status, Operately.Tasks.Status, on_replace: :update
    field :closed_at, :naive_datetime
    field :reopened_at, :naive_datetime

    # Deprecated: use task_status embed instead
    field :status, :string, default: "todo"

    # populated with after load hooks
    field :permissions, :any, virtual: true
    field :comments_count, :integer, virtual: true
    field :available_statuses, {:array, :map}, virtual: true
    field :assigned_at, :naive_datetime, virtual: true

    timestamps()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(task, attrs) do
    task
    |> cast(attrs, [
      :name,
      :deprecated_due_date,
      :description,
      :size,
      :priority,
      :creator_id,
      :status,
      :closed_at,
      :reopened_at,
      :milestone_id,
      :project_id,
      :space_id,
      :subscription_list_id
    ])
    |> cast_embed(:due_date)
    |> cast_embed(:reminders)
    |> cast_embed(:task_status)
    |> put_default_task_status()
    |> validate_required([:name, :description, :creator_id, :subscription_list_id])
    |> validate_project_or_group()
  end

  def template_changeset(attrs) do
    template_changeset(%__MODULE__{}, attrs)
  end

  def template_changeset(task, attrs) do
    task
    |> changeset(attrs)
    |> cast(attrs, [:template_due_offset_days])
    |> validate_number(:template_due_offset_days, greater_than_or_equal_to: 0)
  end

  def getter_profile(:default) do
    %Profile{
      scope: &scope_out_project_templates/1,
      access_contexts: [:project_access_context, :space_access_context]
    }
  end

  defp scope_out_project_templates(query) do
    from([resource: task] in query,
      where:
        is_nil(task.project_id) or
          exists(
            from project in Operately.Projects.Project,
              where: project.id == parent_as(:resource).project_id and project.kind == :project
          )
    )
  end

  @impl Operately.WorkMaps.WorkMapItem
  def status(task = %__MODULE__{}) do
    task.task_status
  end

  @impl Operately.WorkMaps.WorkMapItem
  def state(task = %__MODULE__{}) do
    cond do
      task.closed_at -> :closed
      task.task_status && task.task_status.closed -> :closed
      true -> :active
    end
  end

  @impl Operately.WorkMaps.WorkMapItem
  def next_step(_task = %__MODULE__{}) do
    ""
  end

  @impl Operately.WorkMaps.WorkMapItem
  def progress_percentage(_task = %__MODULE__{}) do
    0.0
  end

  defp put_default_task_status(changeset) do
    case Ecto.Changeset.get_field(changeset, :task_status) do
      nil -> Ecto.Changeset.put_embed(changeset, :task_status, Operately.Tasks.Status.default_task_status())
      _ -> changeset
    end
  end

  defp validate_project_or_group(changeset) do
    project_id = Ecto.Changeset.get_field(changeset, :project_id)
    space_id = Ecto.Changeset.get_field(changeset, :space_id)

    case {project_id, space_id} do
      {nil, nil} ->
        changeset
        |> Ecto.Changeset.add_error(:project_id, "either project_id or space_id must be present")
        |> Ecto.Changeset.add_error(:space_id, "either project_id or space_id must be present")

      {nil, _} ->
        changeset

      {_, nil} ->
        changeset

      {_, _} ->
        changeset
        |> Ecto.Changeset.add_error(:project_id, "cannot have both project_id and space_id")
        |> Ecto.Changeset.add_error(:space_id, "cannot have both project_id and space_id")
    end
  end

  def task_type(task = %__MODULE__{}) do
    cond do
      is_nil(task.project_id) -> "space"
      is_nil(task.space_id) -> "project"
    end
  end

  #
  # Scopes
  #

  import Ecto.Query, only: [from: 2]

  def scope_company(query, company_id) do
    from t in query, join: c in assoc(t, :company), where: c.id == ^company_id
  end

  def scope_space(query, space_id) do
    from t in query, where: t.space_id == ^space_id
  end

  def scope_milestone(query, milestone_id) do
    from t in query, where: t.milestone_id == ^milestone_id
  end

  #
  # After load hooks
  #

  def load_comments_count(tasks) do
    task_ids = Enum.map(tasks, & &1.id)

    counts =
      from(c in Operately.Updates.Comment,
        where: c.entity_id in ^task_ids and c.entity_type == :project_task,
        group_by: c.entity_id,
        select: {c.entity_id, count(c.id)}
      )
      |> Operately.Repo.all()
      |> Enum.into(%{})

    Enum.map(tasks, fn t ->
      count = Map.get(counts, t.id, 0)
      Map.put(t, :comments_count, count)
    end)
  end

  def set_permissions(task = %__MODULE__{}, company_read_only \\ false) do
    perms = Operately.Projects.Permissions.calculate(task.request_info.access_level, company_read_only: company_read_only)
    Map.put(task, :permissions, perms)
  end

  def available_statuses(task = %__MODULE__{}) do
    task =
      if Ecto.assoc_loaded?(task.project) and Ecto.assoc_loaded?(task.space) do
        task
      else
        Operately.Repo.preload(task, [:project, :space])
      end

    cond do
      task.project -> task.project.task_statuses || []
      task.space -> task.space.task_statuses || []
      true -> []
    end
  end

  def preload_available_statuses(task = %__MODULE__{}) do
    Map.put(task, :available_statuses, available_statuses(task))
  end
end
