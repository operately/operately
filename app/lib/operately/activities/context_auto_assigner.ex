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
    "company_adding",
    "company_editing",
    "company_admin_added",
    "company_owners_adding",
    "company_owner_removing",
    "company_admin_removed",
    "company_member_removed",
    "company_member_restoring",
    "company_members_permissions_edited",
    "guest_invited",
    "password_first_time_changed",
    "company_invitation_token_created",
    "company_member_added",
  ]

  @space_actions [
    "space_joining",
    "space_permissions_edited",
    "space_added",
    "space_members_permissions_edited",
    "space_members_added",
    "space_member_removed",
    "group_edited",

    "goal_archived",

    "discussion_posting",
    "discussion_editing",
    "discussion_comment_submitted",
    "message_archiving",
    "space_task_commented",
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
    "project_contributors_addition",
    "project_contributor_removed",
    "project_discussion_submitted",
    "project_goal_connection",
    "project_goal_disconnection",
    "project_milestone_commented",
    "project_moved",
    "project_pausing",
    "project_renamed",
    "project_permissions_edited",
    "project_resuming",
    "project_timeline_edited",
    "project_contributor_edited",
    "project_retrospective_edited",
    "project_retrospective_commented",
    "project_key_resource_added",
    "project_key_resource_deleted",
    "project_start_date_updating",
    "project_due_date_updating",
    "project_champion_updating",
    "project_reviewer_updating",
    "project_milestone_creation",
    "project_milestone_updating",
    "project_description_changed",
    "project_task_commented",
    "milestone_title_updating",
    "milestone_due_date_updating",
    "milestone_description_updating",
    "milestone_deleting",
  ]

  @task_actions [
    "task_adding",
    "task_assignee_assignment",
    "task_assignee_updating",
    "task_deleting",
    "task_description_change",
    "task_due_date_updating",
    "task_milestone_updating",
    "task_name_editing",
    "task_name_updating",
    "task_priority_change",
    "task_reopening",
    "task_size_change",
    "task_status_updating",
  ]

  @resource_hub_actions [
    "resource_hub_created",
    "resource_hub_document_created",
    "resource_hub_document_commented",
    "resource_hub_document_edited",
    "resource_hub_document_deleted",
    "resource_hub_file_created",
    "resource_hub_file_commented",
    "resource_hub_file_deleted",
    "resource_hub_file_edited",
    "resource_hub_folder_created",
    "resource_hub_folder_copied",
    "resource_hub_folder_renamed",
    "resource_hub_folder_deleted",
    "resource_hub_parent_folder_edited",
    "resource_hub_link_created",
    "resource_hub_link_commented",
    "resource_hub_link_deleted",
    "resource_hub_link_edited",
  ]

  def assign_context(multi) do
    multi
    |> Multi.update(:updated_activity, fn %{activity: activity} ->
      context_id = fetch_context(activity)

      Activity.changeset(activity, %{access_context_id: context_id})
    end)
  end

  defp fetch_context(activity) do
    cond do
      activity.action in @deprecated_actions -> :ok
      activity.action in @company_actions -> fetch_company_context(activity.content.company_id)
      activity.action in @space_actions -> fetch_space_context(activity)
      activity.action in Operately.Goals.goal_actions() -> fetch_goal_context(activity.content)
      activity.action in @project_actions -> fetch_project_context(activity.content.project_id)
      activity.action in @task_actions -> fetch_project_or_space_context(activity.content)
      activity.action in @resource_hub_actions-> fetch_resource_hub_context(activity.content.space_id)
      activity.action == "comment_added" -> fetch_comment_added_context(activity)
      true ->
        Logger.error("Unhandled activity: #{inspect(activity)}")
        raise "Activity not handled in context assignment #{activity.action}"
    end
  end

  defp fetch_company_context(company_id) do
    from(ac in Context,
      where: ac.company_id == ^company_id,
      select: ac.id
    )
    |> Repo.one()
  end

  defp fetch_space_context(activity) do
    space_id = activity.content.space_id

    from(c in Context,
      where: c.group_id == ^space_id,
      select: c.id
    )
    |> Repo.one()
  end

  defp fetch_goal_context(%{goal_id: goal_id}), do: fetch_goal_context(goal_id)
  defp fetch_goal_context(goal_id) do
    from(c in Context,
      where: c.goal_id == ^goal_id,
      select: c.id
    )
    |> Repo.one()
  end

  defp fetch_project_or_space_context(content) do
    cond do
      Map.get(content, :project_id) != nil ->
        fetch_project_context(content.project_id)

      Map.get(content, :space_id) != nil ->
        from(c in Context,
          where: c.group_id == ^content.space_id,
          select: c.id
        )
        |> Repo.one()

      true ->
        raise "Activity content must have either project_id or space_id"
    end
  end

  defp fetch_project_context(project_id) do
    from(c in Context,
      where: c.project_id == ^project_id,
      select: c.id
    )
    |> Repo.one()
  end

  defp fetch_resource_hub_context(space_id) do
    from(c in Context,
      where: c.group_id == ^space_id,
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
    thread = Repo.get!(Operately.Comments.CommentThread, comment.entity_id)

    case thread.parent_type do
      :activity ->
        # Goal discussions: parent is an activity, get its context
        from(a in Activity,
          where: a.id == ^thread.parent_id,
          select: a.access_context_id
        )
        |> Repo.one()

      :project ->
        # Project discussions: parent is a project, get its context
        fetch_project_context(thread.parent_id)
    end
  end
end
