defmodule Operately.Goals.Goal do
  use Operately.Schema
  use Operately.Repo.Getter

  alias Operately.Access.AccessLevels
  alias Operately.Goals.Permissions
  alias Operately.Goals.Update

  schema "goals" do
    field :name, :string
    field :description, :map

    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :parent_goal, Operately.Goals.Goal, foreign_key: :parent_goal_id

    belongs_to :champion, Operately.People.Person, foreign_key: :champion_id
    belongs_to :reviewer, Operately.People.Person, foreign_key: :reviewer_id
    belongs_to :creator, Operately.People.Person, foreign_key: :creator_id

    has_many :targets, Operately.Goals.Target
    has_many :projects, Operately.Projects.Project, foreign_key: :goal_id

    has_one :access_context, Operately.Access.Context, foreign_key: :goal_id

    # Check-Ins (they are called updates for historical reasons)
    has_many :updates, Operately.Goals.Update
    belongs_to :last_update, Operately.Goals.Update, foreign_key: :last_check_in_id
    field :last_update_status, Ecto.Enum, values: [:on_track, :concern, :caution, :issue, :pending]
    field :next_update_scheduled_at, :utc_datetime

    embeds_one :timeframe, Operately.Goals.Timeframe, on_replace: :delete
    field :deprecated_timeframe, :string

    field :closed_at, :utc_datetime
    belongs_to :closed_by, Operately.People.Person, foreign_key: :closed_by_id
    field :success, :string

    # populated with after load hooks
    field :my_role, :string, virtual: true
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

  def changeset(goal, attrs) do
    goal
    |> cast(attrs, [
      :name,
      :company_id,
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
      :last_check_in_id
    ])
    |> cast_embed(:timeframe)
    |> validate_required([
      :name,
      :company_id,
      :group_id,
      :creator_id
    ])
  end

  def status(goal = %__MODULE__{}) do
    goal = Repo.preload(goal, :last_update)

    cond do
      goal.success == "yes" -> "achieved"
      goal.success == "no" -> "missed"
      Operately.Goals.outdated?(goal) -> "outdated"
      goal.last_update -> goal.last_update.status
      true -> "on_track"
    end
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
end
