defmodule Operately.Activities.ContextAutoAssigner do
  import Ecto.Query

  require Logger

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Access.Context

  @deprecated_actions [
    "project_status_update_acknowledged",
    "project_status_update_commented",
    "project_status_update_edit",
    "project_status_update_submitted",
    "project_review_submitted",
    "project_review_request_submitted",
    "project_review_acknowledged",
    "project_review_commented",
  ]

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
    "project_discussion_submitted",
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

  def assign_context(multi) do
    multi
    |> Multi.update(:updated_activity, fn %{activity: activity} ->
      context_id = fetch_context(activity)

      Activity.changeset(activity, %{context_id: context_id})
    end)
  end

  defp fetch_context(activity) do
    cond do
      activity.action in @deprecated_actions -> :ok
      activity.action in @company_actions -> fetch_company_context(activity.content.company_id)
      activity.action in @space_actions -> fetch_space_context(activity)
      activity.action in @goal_actions -> fetch_goal_context(activity.content.goal_id)
      activity.action in @project_actions -> fetch_project_context(activity.content.project_id)
      activity.action in @task_actions -> fetch_task_project_context(activity.content.task_id)
      activity.action == "comment_added" -> fetch_comment_added_context(activity)
      true ->
        Logger.error("Unhandled activity: #{inspect(activity)}")
        raise "Activity not handled in context assignment #{activity.action}"
    end
  end

  defp fetch_company_context(company_id) do
    from(ac in Context,
      join: c in assoc(ac, :company),
      where: c.id == ^company_id,
      select: ac.id
    )
    |> Repo.one()
  end

  defp fetch_space_context(activity) do
    space_id = case activity.action do
      "group_edited" ->
        activity.content.group_id
      "goal_reparent" ->
        activity.content.new_parent_goal_id
      _ ->
        activity.content.space_id
    end

    from(c in Context,
      join: g in assoc(c, :group),
      where: g.id == ^space_id,
      select: c.id
    )
    |> Repo.one()
  end

  defp fetch_goal_context(goal_id) do
    from(c in Context,
      join: g in assoc(c, :goal),
      where: g.id == ^goal_id,
      select: c.id
    )
    |> Repo.one()
  end

  defp fetch_project_context(project_id) do
    from(c in Context,
      join: p in assoc(c, :project),
      where: p.id == ^project_id,
      select: c.id
    )
    |> Repo.one()
  end

  defp fetch_task_project_context(task_id) do
    from(c in Context,
      join: p in assoc(c, :project),
      join: m in assoc(p, :milestones),
      join: t in assoc(m, :tasks),
      where: t.id == ^task_id,
      select: c.id
    )
    |> Repo.one()
  end

  defp fetch_comment_added_context(activity) do
    comment = Operately.Updates.get_comment!(activity.content.comment_id)

    case comment.entity_type do
      :project_check_in -> fetch_project_context(comment.entity_id)
      :update -> fetch_goal_context(comment.entity_id)
      :comment_thread -> fetch_comment_thread_context(comment)
      _ ->
        Logger.error("Unhandled activity: #{inspect(activity)}")
        Logger.error("Comment associated with activity: #{inspect(comment)}")
        raise "Activity not handled in context assignment #{activity.action}"
    end
  end

  defp fetch_comment_thread_context(comment) do
    from(a in Activity,
      join: t in Operately.Comments.CommentThread,
      on: a.id == t.parent_id,
      where: t.id == ^comment.entity_id,
      select: a.context_id
    )
    |> Repo.one()
  end
end
