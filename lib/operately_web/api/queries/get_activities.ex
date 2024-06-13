defmodule OperatelyWeb.Api.Queries.GetActivities do
  use TurboConnect.Query

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Projects.Project
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Updates.Update

  import Ecto.Query, only: [from: 2, limit: 2, preload: 2]

  inputs do
    field :scope_id, :string
    field :scope_type, :string
    field :actions, list_of(:string)
  end

  outputs do
    field :activities, list_of(:activity)
  end

  def call(conn, inputs) do
    company_id = conn.assigns.current_account.person.company_id
    scope_id = inputs[:scope_id]
    scope_type = inputs[:scope_type]
    actions = inputs[:actions]
    activities = load_activities(company_id, scope_type, scope_id, actions)

    {:ok, %{activities: OperatelyWeb.Api.Serializers.Activity.serialize(activities)}}
  end

  #
  # Loading data
  #

  def load_activities(company_id, scope_type, scope_id, actions) do
    Activity
    |> limit_search_to_current_company(company_id)
    |> scope_query(scope_type, scope_id)
    |> filter_by_action(actions || [])
    |> order_desc()
    |> limit(100)
    |> preload([:comment_thread, :author])
    |> Repo.all()
    |> Enum.map(&Operately.Activities.cast_content/1)
    |> preload_projects()
    |> preload_goals()
    |> preload_spaces()
    |> preload_discussions()
  end

  def limit_search_to_current_company(query, company_id) do
    from a in query, where: fragment("? ->> ? = ?", a.content, "company_id", ^company_id)
  end

  def scope_query(query, "person", scope_id) do
    from a in query, where: a.author_id == ^scope_id
  end

  def scope_query(query, scope_type, scope_id) do
    from a in query, where: fragment("? ->> ? = ?", a.content, ^"#{scope_type}_id", ^scope_id)
  end

  def order_desc(query) do
    from a in query, order_by: [desc: a.inserted_at]
  end

  def filter_by_action(query, []) do
    from a in query, where: a.action not in ^Activity.deprecated_actions()
  end

  def finter_by_action(query, actions) do
    from a in query, where: a.action in ^actions and a.action not in ^Activity.deprecated_actions()
  end

  def preload_projects(activities) do
    project_ids = activities |> Enum.filter(fn a -> a.content["project_id"] end) |> Enum.map(fn a -> a.content["project_id"] end)

    query = from p in Project, where: p.id in ^project_ids
    opts = [include_deleted: true]

    projects = Repo.all(query, opts) |> Enum.map(fn p -> {p.id, p} end) |> Map.new()
  
    Enum.map(activities, fn a ->
      if a.content["project_id"] do
        put_in(a, [Access.key(:content), Access.key(:project)], Map.get(projects, a.content["project_id"]))
      else
        a
      end
    end)
  end

  def preload_goals(activities) do
    goal_ids = activities |> Enum.filter(fn a -> a.content["goal_id"] end) |> Enum.map(fn a -> a.content["goal_id"] end)

    query = from g in Goal, where: g.id in ^goal_ids
    opts = [include_deleted: true]

    goals = Repo.all(query, opts) |> Enum.map(fn g -> {g.id, g} end) |> Map.new()
  
    Enum.map(activities, fn a ->
      if a.content["goal_id"] do
        put_in(a, [Access.key(:content), Access.key(:goal)], Map.get(goals, a.content["goal_id"]))
      else
        a
      end
    end)
  end

  def preload_spaces(activities) do
    space_ids = activities |> Enum.filter(fn a -> a.content["space_id"] end) |> Enum.map(fn a -> a.content["space_id"] end)

    query = from g in Group, where: g.id in ^space_ids
    opts = [include_deleted: true]

    spaces = Repo.all(query, opts) |> Enum.map(fn s -> {s.id, s} end) |> Map.new()
  
    Enum.map(activities, fn a ->
      if a.content["space_id"] do
        put_in(a, [Access.key(:content), Access.key(:space)], Map.get(spaces, a.content["space_id"]))
      else
        a
      end
    end)
  end

  def preload_discussions(activities) do
    discussion_ids = activities |> Enum.filter(fn a -> a.content["discussion_id"] end) |> Enum.map(fn a -> a.content["discussion_id"] end)
    discussions = Repo.all(from d in Update, where: d.id in ^discussion_ids) |> Enum.map(fn d -> {d.id, d} end) |> Map.new()
  
    Enum.map(activities, fn a ->
      if a.content["discussion_id"] do
        put_in(a, [Access.key(:content), Access.key(:discussion)], Map.get(discussions, a.content["discussion_id"]))
      else
        a
      end
    end)
  end

end
