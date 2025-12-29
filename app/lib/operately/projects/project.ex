defmodule Operately.Projects.Project do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Repo
  alias Operately.Access.AccessLevels
  alias Operately.WorkMaps.WorkMapItem
  alias Operately.ContextualDates.Timeframe
  alias Operately.Projects.{Contributor, Permissions, CheckIn}

  @behaviour WorkMapItem

  schema "projects" do
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id
    belongs_to :creator, Operately.People.Person, foreign_key: :creator_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :goal, Operately.Goals.Goal, foreign_key: :goal_id

    has_many :contributors, Contributor, foreign_key: :project_id
    has_many :contributing_people, through: [:contributors, :person]
    has_many :key_resources, Operately.Projects.KeyResource, foreign_key: :project_id
    has_many :milestones, Operately.Projects.Milestone, foreign_key: :project_id
    has_many :check_ins, CheckIn, foreign_key: :project_id
    has_many :tasks, Operately.Tasks.Task, foreign_key: :project_id

    has_one :champion_contributor, Contributor, foreign_key: :project_id, where: [role: "champion"]
    has_one :reviewer_contributor, Contributor, foreign_key: :project_id, where: [role: "reviewer"]

    has_one :access_context, Operately.Access.Context, foreign_key: :project_id
    has_one :champion, through: [:champion_contributor, :person]
    has_one :reviewer, through: [:reviewer_contributor, :person]

    belongs_to :subscription_list, Operately.Notifications.SubscriptionList, foreign_key: :subscription_list_id

    field :description, :map
    field :name, :string
    field :private, :boolean, default: false

    embeds_one :timeframe, Operately.ContextualDates.Timeframe, on_replace: :delete
    embeds_many :task_statuses, Operately.Tasks.Status, on_replace: :delete

    belongs_to :last_check_in, CheckIn, foreign_key: :last_check_in_id
    field :last_check_in_status, Ecto.Enum, values: CheckIn.valid_status()
    field :next_check_in_scheduled_at, :utc_datetime

    field :health, Ecto.Enum, values: [:on_track, :at_risk, :off_track, :paused, :unknown], default: :on_track

    #
    # Deprecated, use next_check_in_scheduled_at instead next_update_scheduled_at
    # started_at and deadline should be removed once we are sure that all the migrations have run
    field :next_update_scheduled_at, :utc_datetime
    field :started_at, :utc_datetime
    field :deadline, :utc_datetime

    has_one :retrospective, Operately.Projects.Retrospective, foreign_key: :project_id
    field :status, :string, default: "active"
    field :closed_at, :utc_datetime
    field :success_status, Ecto.Enum, values: [:achieved, :missed]

    field :milestones_ordering_state, {:array, :string}, default: Operately.Projects.OrderingState.initialize()
    field :tasks_kanban_state, :map, default: Operately.Tasks.KanbanState.initialize()

    # populated with after load hooks
    field :next_milestone, :any, virtual: true
    field :permissions, :any, virtual: true
    field :access_levels, :any, virtual: true
    field :privacy, :any, virtual: true
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true, default: []

    timestamps()
    soft_delete()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(project, attrs) do
    project
    |> cast(attrs, [
      :name,
      :description,
      :group_id,
      :goal_id,
      :next_check_in_scheduled_at,
      :health,
      :company_id,
      :creator_id,
      :private,
      :deleted_at,
      :status,
      :closed_at,
      :success_status,
      :last_check_in_id,
      :last_check_in_status,
      :next_update_scheduled_at,
      :started_at,
      :deadline,
      :milestones_ordering_state,
      :subscription_list_id,
      :tasks_kanban_state
    ])
    |> cast_embed(:timeframe)
    |> cast_embed(:task_statuses)
    |> put_default_task_statuses()
    |> validate_required([
      :name,
      :company_id,
      :group_id,
      :creator_id,
      :subscription_list_id
    ])
  end

  defp put_default_task_statuses(%Ecto.Changeset{data: %__MODULE__{id: nil}} = changeset) do
    # Only set defaults for new projects, and only if task_statuses is empty or not provided
    case Ecto.Changeset.get_field(changeset, :task_statuses) do
      [] -> Ecto.Changeset.put_embed(changeset, :task_statuses, Operately.Tasks.Status.default_task_statuses())
      nil -> Ecto.Changeset.put_embed(changeset, :task_statuses, Operately.Tasks.Status.default_task_statuses())
      _ -> changeset
    end
  end

  defp put_default_task_statuses(changeset), do: changeset

  def task_status_values(project = %__MODULE__{}) do
    project.task_statuses
    |> Elixir.List.wrap()
    |> Enum.map(& &1.value)
    |> Enum.filter(& &1)
    |> Enum.map(&to_string/1)
  end

  def get_default_task_status(project = %__MODULE__{}) do
    statuses = project.task_statuses

    Enum.find(statuses, fn s -> s.color == :gray end) ||
      Enum.find(statuses, fn s -> s.color == :blue end) ||
      List.first(statuses)
  end

  @impl WorkMapItem
  def status(project = %__MODULE__{}) do
    cond do
      project.success_status -> project.success_status
      project.status == "paused" -> :paused
      Operately.Projects.outdated?(project) -> :outdated
      project.last_check_in_status -> project.last_check_in_status
      true -> :pending
    end
  end

  @impl WorkMapItem
  def state(project = %__MODULE__{}) do
    cond do
      project.closed_at -> :closed
      project.status == "paused" -> :paused
      true -> :active
    end
  end

  @impl WorkMapItem
  def next_step(project = %__MODULE__{}) do
    project = set_next_milestone(project)

    if(project.next_milestone, do: project.next_milestone.title, else: "")
  end

  @impl WorkMapItem
  def progress_percentage(project = %__MODULE__{}) do
    total_milestones = length(project.milestones)

    if total_milestones > 0 do
      completed_milestones =
        Enum.count(project.milestones, fn milestone ->
          case milestone do
            %{status: status} when status == :done -> true
            _ -> false
          end
        end)

      completed_milestones / total_milestones * 100
    else
      0
    end
  end

  # Scopes

  import Operately.Access.Filters, only: [filter_by_view_access: 2]
  import Ecto.Query, only: [from: 2, from: 1, where: 3, limit: 2, order_by: 3]

  def scope_company(query, company_id) do
    from p in query, where: p.company_id == ^company_id
  end

  def scope_visibility(query, person_id) do
    alias Operately.Projects.Contributor

    sub =
      from c in Contributor,
        where: c.project_id == parent_as(:project).id,
        where: c.person_id == ^person_id

    from p in query, where: not p.private or exists(sub)
  end

  def scope_role(query, person_id, roles) do
    alias Operately.Projects.Contributor

    sub =
      from c in Contributor,
        where: c.project_id == parent_as(:project).id,
        where: c.person_id == ^person_id,
        where: c.role in ^roles

    from p in query, where: exists(sub)
  end

  def scope_space(query, nil), do: query

  def scope_space(query, space_id) do
    from p in query, where: p.group_id == ^space_id
  end

  def scope_goal(query, nil), do: query

  def scope_goal(query, goal_id) do
    from p in query, where: p.goal_id == ^goal_id
  end

  # Queries

  def order_by_name(query) do
    from p in query, order_by: [asc: p.name]
  end

  def search_potential_parent_goals(project, requester, search_term) do
    from(g in Operately.Goals.Goal)
    |> where([g], g.company_id == ^project.company_id)
    |> where([g], ilike(g.name, ^"%#{search_term}%"))
    |> where([g], is_nil(g.closed_at))
    |> filter_by_view_access(requester.id)
    |> maybe_exclude_goal_by_id(project.goal_id)
    |> order_by([g], asc: g.name)
    |> limit(10)
    |> Operately.Repo.all()
  end

  defp maybe_exclude_goal_by_id(q, nil), do: q
  defp maybe_exclude_goal_by_id(q, goal_id), do: where(q, [g], g.id != ^goal_id)

  # After load hooks

  def after_load_hooks(projects) when is_list(projects) do
    Enum.map(projects, fn project -> after_load_hooks(project) end)
  end

  def after_load_hooks(nil), do: nil

  def after_load_hooks(project = %__MODULE__{}) do
    project
    |> set_next_milestone()
  end

  def set_next_milestone(project = %__MODULE__{}) do
    case project.milestones do
      [] ->
        project

      %Ecto.Association.NotLoaded{} ->
        project

      milestones ->
        next =
          milestones
          |> Enum.filter(fn milestone -> milestone.status == :pending end)
          |> Enum.sort(fn milestone1, milestone2 ->
            date1 = Timeframe.end_date(milestone1.timeframe)
            date2 = Timeframe.end_date(milestone2.timeframe)

            case {date1, date2} do
              {nil, nil} -> false
              {nil, _} -> false
              {_, nil} -> true
              {d1, d2} -> Date.compare(d1, d2) != :gt
            end
          end)
          |> List.first()

        Map.put(project, :next_milestone, next)
    end
  end

  def load_contributor_access_levels(project) do
    contribs = Contributor.load_project_access_levels(project.contributors)
    Map.put(project, :contributors, contribs)
  end

  def set_permissions(project = %__MODULE__{}) do
    perms = Permissions.calculate(project.request_info.access_level)
    Map.put(project, :permissions, perms)
  end

  def set_permissions(%{project: project = %__MODULE__{}} = parent) do
    perms = Permissions.calculate(parent.request_info.access_level)
    project = Map.put(project, :permissions, perms)

    %{parent | project: project}
  end

  def load_potential_subscribers(project = %__MODULE__{}) do
    q = from(c in Operately.Projects.Contributor, join: p in assoc(c, :person), preload: :person)
    contributors = Repo.preload(project, [contributors: q], force: true).contributors

    subscribers = Operately.Notifications.Subscriber.from_project_contributor(contributors)
    Map.put(project, :potential_subscribers, subscribers)
  end

  def load_access_levels(project) do
    context = Operately.Access.get_context!(project_id: project.id)
    access_levels = AccessLevels.load(context.id, project.company_id, project.group_id)

    Map.put(project, :access_levels, access_levels)
  end

  def load_privacy(projects) when is_list(projects) do
    Enum.map(projects, &load_privacy/1)
  end

  def load_privacy(project) do
    project = if project.access_levels, do: project, else: load_access_levels(project)
    Map.put(project, :privacy, AccessLevels.calc_privacy(project.access_levels))
  end

  def load_milestones(p = %__MODULE__{}) do
    milestones =
      Repo.preload(p, :milestones).milestones
      |> Operately.Projects.Milestone.load_comments_count()
      |> Enum.map(fn milestone -> %{milestone | project: p} end)

    Map.put(p, :milestones, milestones)
  end

  def get_access_context(project = %__MODULE__{}) do
    get_access_context(project.id)
  end

  def get_access_context(project_id) when is_binary(project_id) do
    Operately.Access.get_context!(project_id: project_id)
  end

  def list_discussions(project_id) do
    project_id
    |> Operately.Comments.CommentThread.list_for_project()
    |> Operately.Repo.preload([:author])
    |> Operately.Updates.Comment.load_comments_count()
  end
end
