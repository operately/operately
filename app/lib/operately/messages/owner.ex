defmodule Operately.Messages.Owner do
  import Ecto.Query
  alias Operately.Access.Context
  alias Operately.Activities
  alias Operately.Activities.Activity
  alias Operately.Goals.Goal
  alias Operately.Groups.Group
  alias Operately.Messages.{Message, MessagesBoard}
  alias Operately.Notifications.Subscriber
  alias Operately.Projects.Project
  alias Operately.Repo

  def fields(%Group{id: space_id}, attrs) do
    query = from(b in MessagesBoard, where: b.space_id == ^space_id, select: b.id)
    query = if attrs[:messages_board_id], do: where(query, [b], b.id == ^attrs.messages_board_id), else: query

    case Repo.one(query) do
      nil -> {:error, :not_found}
      board_id -> {:ok, %{messages_board_id: board_id}}
    end
  end

  def fields(%Project{id: id}, _attrs), do: {:ok, %{project_id: id}}
  def fields(%Goal{id: id}, _attrs), do: {:ok, %{goal_id: id}}

  defp load(%Message{project_id: id} = message) when not is_nil(id), do: Repo.preload(message, :project).project
  defp load(%Message{goal_id: id} = message) when not is_nil(id), do: Repo.preload(message, :goal).goal
  defp load(%Message{} = message), do: Repo.preload(message, :space).space

  def record_activity(multi, _, %{state: state}, _) when state != :published, do: multi

  def record_activity(multi, %{state: :published, title: title, body: body}, %{title: title, body: body}, _), do: multi

  def record_activity(multi, previous, message, actor_id) do
    owner = load(message)
    event = if previous && previous.state == :published, do: edited(owner, message), else: posted(owner, message)

    case event do
      nil -> multi
      {action, content} -> Activities.insert_sync(multi, actor_id, action, fn _ -> content end)
    end
  end

  defp posted(%Group{} = space, message) do
    {:discussion_posting, %{company_id: space.company_id, space_id: space.id, discussion_id: message.id, title: message.title}}
  end

  defp posted(%Project{} = project, message) do
    {:project_discussion_submitted, %{company_id: project.company_id, space_id: project.group_id, project_id: project.id, discussion_id: message.id, title: message.title}}
  end

  defp posted(%Goal{} = goal, message) do
    {:goal_discussion_creation, %{company_id: goal.company_id, space_id: goal.group_id, goal_id: goal.id, discussion_id: message.id}}
  end

  defp edited(%Group{} = space, message) do
    {:discussion_editing, %{company_id: space.company_id, space_id: space.id, discussion_id: message.id}}
  end

  # Published project discussion edits have never generated a feed entry.
  defp edited(%Project{}, _message), do: nil

  defp edited(%Goal{} = goal, message) do
    activity_id = Repo.one!(from(a in Activity, where: a.action == "goal_discussion_creation" and a.content["discussion_id"] == ^message.id, select: a.id))
    {:goal_discussion_editing, %{company_id: goal.company_id, space_id: goal.group_id, goal_id: goal.id, activity_id: activity_id}}
  end

  def subscriber_preloads(%Message{project_id: id}) when not is_nil(id), do: [project: [:access_context, contributors: :person]]
  def subscriber_preloads(%Message{goal_id: id}) when not is_nil(id), do: [goal: [:access_context, :champion, :reviewer, group: :members]]
  def subscriber_preloads(%Message{}), do: [:access_context, space: :members]

  def subscribers(%Message{messages_board_id: id, access_context: %Context{} = context, space: %Group{members: members}}) when not is_nil(id) and is_list(members) do
    {context, Subscriber.from_space_members(members)}
  end

  def subscribers(%Message{project_id: id, project: %Project{access_context: %Context{} = context, contributors: contributors}}) when not is_nil(id) and is_list(contributors) do
    {context, Subscriber.from_project_contributor(contributors)}
  end

  def subscribers(%Message{goal_id: id, goal: %Goal{access_context: %Context{} = context, group: %Group{members: members}} = goal}) when not is_nil(id) and is_list(members) do
    {context, Subscriber.from_goal(goal)}
  end
end
