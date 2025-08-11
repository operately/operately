defmodule Operately.Goals.Goal do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.WorkMaps.WorkMapItem
  alias Operately.Access.AccessLevels
  alias Operately.Goals.{Permissions, Update, Target}

  schema "goals" do
    field :name, :string
    field :description, :map

    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :parent_goal, Operately.Goals.Goal, foreign_key: :parent_goal_id

    belongs_to :champion, Operately.People.Person, foreign_key: :champion_id
    belongs_to :reviewer, Operately.People.Person, foreign_key: :reviewer_id
    belongs_to :creator, Operately.People.Person, foreign_key: :creator_id

    has_many :targets, Target
    has_many :projects, Operately.Projects.Project, foreign_key: :goal_id
    has_many :checks, Operately.Goals.Check, foreign_key: :goal_id

    has_one :access_context, Operately.Access.Context, foreign_key: :goal_id

    # Check-Ins (they are called updates for historical reasons)
    has_many :updates, Update
    belongs_to :last_update, Update, foreign_key: :last_check_in_id
    field :last_update_status, Ecto.Enum, values: Update.valid_statuses()
    field :next_update_scheduled_at, :utc_datetime

    embeds_one :timeframe, Operately.ContextualDates.Timeframe, on_replace: :delete
    field :deprecated_timeframe, :string

    field :closed_at, :utc_datetime
    belongs_to :closed_by, Operately.People.Person, foreign_key: :closed_by_id
    field :success, :string
    field :success_status, Ecto.Enum, values: [:achieved, :missed]

    # populated with after load hooks
    field :my_role, :string, virtual: true
    field :permissions, :any, virtual: true
    field :access_levels, :any, virtual: true
    field :privacy, :any, virtual: true
    field :potential_subscribers, :any, virtual: true
    field :notifications, :any, virtual: true, default: []
    field :retrospective, :any, virtual: true

    timestamps()
    soft_delete()
    requester_access_level()
    request_info()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(goal, attrs) do
    goal
    |> cast(attrs, [
      :name,
      :company_id,
      :description,
      :group_id,
      :champion_id,
      :reviewer_id,
      :creator_id,
      :deprecated_timeframe,
      :description,
      :next_update_scheduled_at,
      :parent_goal_id,
      :closed_at,
      :closed_by_id,
      :success,
      :success_status,
      :last_check_in_id,
      :last_update_status
    ])
    |> cast_embed(:timeframe)
    |> validate_required([
      :name,
      :company_id,
      :group_id,
      :creator_id
    ])
  end

  @behaviour WorkMapItem

  @impl WorkMapItem
  def status(goal = %__MODULE__{}) do
    cond do
      goal.success_status -> goal.success_status
      goal.success == "yes" -> :achieved
      goal.success == "no" -> :missed
      Operately.Goals.outdated?(goal) -> :outdated
      goal.last_update_status -> goal.last_update_status
      true -> :pending
    end
  end

  @impl WorkMapItem
  def state(goal = %__MODULE__{}) do
    if goal.closed_at do
      :closed
    else
      :active
    end
  end

  @impl WorkMapItem
  def next_step(goal = %__MODULE__{}) do
    assert_targets_loaded(goal)
    assert_checks_loaded(goal)

    pending_target =
      goal.targets
      |> Enum.filter(&Target.done?/1)
      |> Enum.sort_by(fn target -> target.index end)
      |> List.first()

    pending_check =
      goal.checks
      |> Enum.filter(&(!&1.completed))
      |> Enum.sort_by(fn check -> check.index end)
      |> List.first()

    case {pending_target, pending_check} do
      {nil, nil} -> ""
      {nil, check} -> check.name
      {target, nil} -> target.name
      {target, _check} -> target.name
    end
  end

  @impl WorkMapItem
  def progress_percentage(goal = %__MODULE__{}) do
    assert_targets_loaded(goal)
    assert_checks_loaded(goal)

    targets = Enum.map(goal.targets, &Target.target_progress_percentage/1)
    checklist = checklist_progress(goal)

    progresses =
      case goal.checks do
        [] -> targets
        _ -> targets ++ [checklist]
      end

    average(progresses, length(progresses))
  end

  #
  # Scopes
  #

  import Ecto.Query, only: [from: 2]

  def scope_space(query, nil), do: query

  def scope_space(query, space_id) do
    from g in query, where: g.group_id == ^space_id
  end

  def scope_company(query, company_id) do
    from g in query, where: g.company_id == ^company_id
  end

  #
  # Queries
  #

  def set_permissions(%{goal: goal = %__MODULE__{}} = parent) do
    goal = preload_permissions(goal, parent.request_info.access_level)

    %{parent | goal: goal}
  end

  def preload_permissions(goal) do
    preload_permissions(goal, goal.request_info.access_level)
  end

  def preload_permissions(goal, access_level) do
    Map.put(goal, :permissions, Permissions.calculate(access_level))
  end

  def preload_access_levels(goal) do
    context = Operately.Access.get_context!(goal_id: goal.id)
    access_levels = AccessLevels.load(context.id, goal.company_id, goal.group_id)

    Map.put(goal, :access_levels, access_levels)
  end

  def load_privacy(goal = %__MODULE__{}) do
    goal = if goal.access_levels, do: goal, else: preload_access_levels(goal)
    Map.put(goal, :privacy, AccessLevels.calc_privacy(goal.access_levels))
  end

  def set_potential_subscribers(goal = %__MODULE__{}) do
    subscribers = Operately.Notifications.Subscriber.from_goal(goal)
    Map.put(goal, :potential_subscribers, subscribers)
  end

  def load_last_check_in_permissions(goal = %__MODULE__{}) do
    goal = Repo.preload(goal, :last_update)

    if goal.last_update do
      last_update = Update.preload_permissions(goal.last_update, goal.request_info.access_level, goal.request_info.requester.id)
      Map.put(goal, :last_update, last_update)
    else
      goal
    end
  end

  def load_retrospective(goal = %__MODULE__{}) do
    Map.put(goal, :retrospective, Operately.Goals.Retrospective.find(goal.id))
  end

  def target_count(goal = %__MODULE__{}) do
    goal
    |> Repo.preload(:targets)
    |> Map.get(:targets, [])
    |> Enum.count()
  end

  def search_potential_parent_goals(goal, requester, search_term) do
    import Operately.Access.Filters, only: [filter_by_view_access: 2]
    import Ecto.Query, only: [from: 1, where: 3, limit: 2, order_by: 3]

    from(g in __MODULE__)
    |> where([g], g.company_id == ^goal.company_id)
    |> where([g], ilike(g.name, ^"%#{search_term}%"))
    |> where([g], is_nil(g.closed_at))
    |> filter_by_view_access(requester.id)
    |> where([g], g.id != ^goal.id and g.id not in ^collect_descendant_goal_ids(goal))
    |> order_by([g], asc: g.name)
    |> limit(10)
    |> Operately.Repo.all()
  end

  defp collect_descendant_goal_ids(goal) do
    sql = """
    WITH RECURSIVE descendants AS (
      SELECT id FROM goals WHERE parent_goal_id = $1
      UNION ALL
      SELECT g.id FROM goals g
      INNER JOIN descendants d ON g.parent_goal_id = d.id
    )
    SELECT id FROM descendants
    """

    {:ok, %{rows: rows}} = Operately.Repo.query(sql, [Ecto.UUID.dump!(goal.id)])
    Enum.map(rows, fn [id] -> Ecto.UUID.load!(id) end)
  end

  defp assert_targets_loaded(goal) do
    case goal.targets do
      %Ecto.Association.NotLoaded{} -> raise "Targets not loaded. Preload the targets before calling"
      _ -> :ok
    end
  end

  defp assert_checks_loaded(goal) do
    case goal.checks do
      %Ecto.Association.NotLoaded{} -> raise "Checks not loaded. Preload the checks before calling"
      _ -> :ok
    end
  end

  defp average(list, count) do
    if count == 0 do
      0
    else
      Enum.sum(list) / count
    end
  end

  defp checklist_progress(goal) do
    if length(goal.checks) == 0 do
      # if no checks, consider it 100% complete
      0
    else
      completed_checks = Enum.count(goal.checks, & &1.completed)
      completed_checks * 100 / length(goal.checks)
    end
  end
end
