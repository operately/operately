defmodule Operately.Data.Change013CreateActivitiesAccessContext do
  import Ecto.Query

  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Activities.Activity

  def run do
    Repo.transaction(fn ->
      from(a in Activity, order_by: [asc: a.inserted_at])
      |> Repo.all()
      |> Enum.map(&Activities.cast_content/1)
      |> assign_context()
    end)
  end

  @company_actions [
    "company_member_removed",
    "password_first_time_changed",
    "company_invitation_token_created",
    "company_member_added",
  ]

  @space_actions [
    "space_joining",

    "goal_archived",

    "discussion_posting",
    "discussion_editing",
    "discussion_comment_submitted",

    "task_assignee_assignment",
    "task_description_change",
    "task_name_editing",
    "task_priority_change",
    "task_reopening",
    "task_size_change",

    # exceptions
    "group_edited",
    "goal_reparent",
  ]

  @goal_actions [
    "goal_check_in",
    "goal_check_in_acknowledgement",
    "goal_check_in_commented",
    "goal_check_in_edit",
    "goal_closing",
    "goal_created",
    "goal_discussion_creation",
    "goal_discussion_editing",
    "goal_editing",
    "goal_reopening",
    "goal_timeframe_editing",
  ]

  @project_actions [
    "project_created",
    "project_archived",
    "project_check_in_acknowledged",
    "project_check_in_commented",
    "project_check_in_edit",
    "project_check_in_submitted",
    "project_closed",
    "project_contributor_addition",
    "project_discusssion_submitted",
    "project_goal_connection",
    "project_goal_disconnection",
    "project_milestone_commented",
    "project_moved",
    "project_pausing",
    "project_renamed",
    "project_resuming",
    "project_timeline_edited",
  ]

  @task_actions [
    "task_adding",
    "task_closing",
    "task_status_change",
    "task_update",
  ]

  defp assign_context(activities) when is_list(activities) do
    Enum.each(activities, &assign_context/1)
  end

  defp assign_context(activity) do
    cond do
      activity.action in @company_actions -> assign_company_context(activity)
      activity.action in @space_actions -> assign_space_context(activity)
      activity.action in @goal_actions -> assign_goal_context(activity, activity.content.goal_id)
      activity.action in @project_actions -> assign_project_context(activity, activity.content.project_id)
      activity.action in @task_actions -> assign_task_project_context(activity)
      activity.action == "comment_added" -> assign_context_to_comment_added(activity)
      true ->
        raise "Activity not handled in the data migration #{activity.action}"
    end
  end

  defp assign_company_context(activity) do
    from(c in Operately.Companies.Company,
      where: c.id == ^activity.content.company_id,
      preload: :access_context
    )
    |> Repo.one()
    |> update_activity(activity)
  end

  defp assign_space_context(activity) do
    space_id = case activity.action do
      "group_edited" ->
        activity.content.group_id
      "goal_reparent" ->
        activity.content.new_parent_goal_id
      _ ->
        activity.content.space_id
    end

    from(g in Operately.Groups.Group,
      where: g.id == ^space_id,
      preload: :access_context
    )
    |> Repo.one()
    |> update_activity(activity)
  end

  defp assign_goal_context(activity, goal_id) do
    from(g in Operately.Goals.Goal,
      where: g.id == ^goal_id,
      preload: :access_context
    )
    |> Repo.one()
    |> update_activity(activity)
  end

  defp assign_project_context(activity, project_id) do
    from(p in Operately.Projects.Project,
      where: p.id == ^project_id,
      preload: :access_context
    )
    |> Repo.one()
    |> update_activity(activity)
  end

  defp assign_task_project_context(activity) do
    from(p in Operately.Projects.Project,
      join: m in assoc(p, :milestones),
      join: t in assoc(m, :tasks),
      where: t.id == ^activity.content.task_id,
      preload: :access_context
    )
    |> Repo.one()
    |> update_activity(activity)
  end

  defp assign_context_to_comment_added(activity) do
    comment = Operately.Updates.get_comment!(activity.content.comment_id)

    case comment.entity_type do
      :project_check_in -> assign_project_context(activity, comment.entity_id)
      :update -> assign_goal_context(activity, comment.entity_id)
      :comment_thread -> update_comment_thread_activity(activity, comment)
    end
  end

  defp update_activity(parent, activity) do
    activity
    |> Activity.changeset(%{context_id: parent.access_context.id})
    |> Repo.update()
  end

  defp update_comment_thread_activity(activity, comment) do
    parent = from(a in Activity,
      join: t in Operately.Comments.CommentThread,
      on: a.id == t.parent_id,
      where: t.id == ^comment.entity_id
    )
    |> Repo.one()

    activity
    |> Activity.changeset(%{context_id: parent.context_id})
    |> Repo.update()
  end
end
