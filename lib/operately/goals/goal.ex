defmodule Operately.Goals.Goal do
  use Operately.Schema
  use Operately.Repo.Getter

  schema "goals" do
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id
    belongs_to :group, Operately.Groups.Group, foreign_key: :group_id
    belongs_to :parent_goal, Operately.Goals.Goal, foreign_key: :parent_goal_id

    belongs_to :champion, Operately.People.Person, foreign_key: :champion_id
    belongs_to :reviewer, Operately.People.Person, foreign_key: :reviewer_id
    belongs_to :creator, Operately.People.Person, foreign_key: :creator_id

    has_many :updates, Operately.Goals.Update
    has_many :targets, Operately.Goals.Target
    has_many :projects, Operately.Projects.Project, foreign_key: :goal_id

    has_one :access_context, Operately.Access.Context, foreign_key: :goal_id

    field :name, :string
    field :next_update_scheduled_at, :utc_datetime

    field :description, :map

    embeds_one :timeframe, Operately.Goals.Timeframe, on_replace: :update
    field :deprecated_timeframe, :string

    field :closed_at, :utc_datetime
    belongs_to :closed_by, Operately.People.Person, foreign_key: :closed_by_id
    field :success, :string

    # populated with after load hooks
    field :my_role, :string, virtual: true
    field :last_check_in, :any, virtual: true
    field :permissions, :any, virtual: true
    field :access_levels, :any, virtual: true
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
    ])
    |> cast_embed(:timeframe)
    |> validate_required([
      :name,
      :company_id,
      :group_id,
      :champion_id,
      :reviewer_id,
      :creator_id,
    ])
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

  def preload_last_check_in(goals) when is_list(goals) do
    alias Operately.Goals.Update

    latest_updates = from(u in Update,
      group_by: u.goal_id,
      select: %{
        goal_id: u.goal_id,
        max_inserted_at: max(u.inserted_at)
      }
    )

    query = from(u in Update,
      join: c in subquery(latest_updates),
      on: u.goal_id == c.goal_id and u.inserted_at == c.max_inserted_at,
      preload: [:author, [reactions: :person]]
    )

    updates = Operately.Repo.all(query)

    Enum.map(goals, fn goal ->
      last_check_in = Enum.find(updates, fn u -> u.goal_id == goal.id end)
      Map.put(goal, :last_check_in, last_check_in)
    end)
  end

  def preload_last_check_in(goal = %__MODULE__{}) do
    [goal] |> preload_last_check_in() |> hd()
  end

  def load_unread_notifications(goal = %__MODULE__{}, person) do
    actions = [
      "goal_created",
      "goal_editing",
      "goal_archived",
    ]

    notifications =
      from(n in Operately.Notifications.Notification,
        join: a in assoc(n, :activity),
        where: a.action in ^actions and a.content["goal_id"] == ^goal.id,
        where: n.person_id == ^person.id and not n.read,
        select: n
      )
      |> Repo.all()

    Map.put(goal, :notifications, notifications)
  end


  def preload_permissions(goal) do 
    preload_permissions(goal, goal.request_info.access_level)
  end

  def preload_permissions(goal, access_level) do
    Map.put(goal, :permissions, Operately.Goals.Permissions.calculate(access_level))
  end

  def preload_access_levels(goal) do
    context = Operately.Access.get_context!(goal_id: goal.id)
    access_levels = Operately.Access.AccessLevels.load(context.id, goal.company_id, goal.group_id)

    Map.put(goal, :access_levels, access_levels)
  end

  def set_potential_subscribers(goal = %__MODULE__{}) do
    subscribers = Operately.Notifications.Subscriber.from_goal(goal)
    Map.put(goal, :potential_subscribers, subscribers)
  end
end
