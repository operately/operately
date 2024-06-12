defmodule OperatelyWeb.Api.Queries.GetActivities do
  use TurboConnect.Query

  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Projects.Project
  alias Operately.Goals.Goal

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

    {:ok, %{activities: serialize(activities)}}
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
    projects = Repo.all(from p in Project, where: p.id in ^project_ids) |> Enum.map(fn p -> {p.id, p} end) |> Map.new()
  
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
    goals = Repo.all(from g in Goal, where: g.id in ^goal_ids) |> Enum.map(fn g -> {g.id, g} end) |> Map.new()
  
    Enum.map(activities, fn a ->
      if a.content["goal_id"] do
        put_in(a, [Access.key(:content), Access.key(:goal)], Map.get(goals, a.content["goal_id"]))
      else
        a
      end
    end)
  end

  #
  # Serializing data
  #

  def serialize(activities) when is_list(activities) do
    Enum.map(activities, &serialize/1)
  end

  def serialize(activity) do
    %{
      id: activity.id,
      action: activity.action,
      author: serialize_author(activity.author),
      comment_thread: activity.comment_thread && serialize_comment_thread(activity.comment_thread),
      content: serialize_content(activity.action, activity.content),
    }
  end

  def serialize_author(author) do
    %{
      id: author.id,
      full_name: author.full_name,
      avatar_url: author.avatar_url,
      timezone: author.timezone
    }
  end

  def serialize_comment_thread(comment_thread) do
    %{
      id: comment_thread.id,
      message: comment_thread.message,
      title: comment_thread.title,
    }
  end

  def serialize_content(_action, content) do
    %{}
    |> serialize_project_on_content(content)
    |> serialize_goal_on_content(content)
  end

  def serialize_project_on_content(res, content) do
    if content["project_id"] do
      Map.put(res, "project", serialize_project(content["project"]))
    else
      res
    end
  end

  def serialize_goal_on_content(res, content) do
    if content["goal"] do
      Map.put(res, "goal", serialize_goal(content["goal"]))
    else
      res
    end
  end

  def serialize_project(project) do
    %{
      id: project.id,
      name: project.name,
    }
  end

  def serialize_goal(goal) do
    %{
      id: goal.id,
      name: goal.name,
    }
  end
end
