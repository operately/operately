defmodule Operately.Activities.ContextAutoAssigner do
  import Ecto.Query

  require Logger

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities.Activity
  alias Operately.Access.Context
  alias Operately.Messages.{Message, MessagesBoard}
  alias Operately.Projects.{CheckIn, Milestone, Retrospective}
  alias Operately.ResourceHubs.{Document, File, Link}
  alias Operately.Tasks.Task
  alias Operately.Goals.Update, as: GoalUpdate
  alias Operately.Updates.Comment, as: UpdateComment

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

    "task_assignee_assignment",
    "task_name_editing",
    "task_priority_change",
    "task_reopening",
    "task_size_change",
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
    "task_name_updating",
    "task_status_updating",
    "task_due_date_updating",
    "task_assignee_updating",
    "task_milestone_updating",
    "task_deleting",
    "task_description_change",
    "project_task_commented",
    "milestone_title_updating",
    "milestone_due_date_updating",
    "milestone_description_updating",
    "milestone_deleting",
  ]

  @task_actions [
    "task_adding",
    "task_closing",
    "task_status_change",
    "task_update",
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
      activity.action in @task_actions -> fetch_task_project_context(activity.content.task_id)
      activity.action in @resource_hub_actions-> fetch_resource_hub_context(activity.content.space_id)
      activity.action in ["comment_added", "comment_deleted"] -> fetch_comment_added_context(activity)
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

  defp fetch_project_context(project_id) do
    from(c in Context,
      where: c.project_id == ^project_id,
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

  defp fetch_resource_hub_context(space_id) do
    from(c in Context,
      where: c.group_id == ^space_id,
      select: c.id
    )
    |> Repo.one()
  end

  defp fetch_comment_added_context(%Activity{action: "comment_deleted"} = activity) do
    fetch_comment_deleted_context(activity)
  end

  defp fetch_comment_added_context(activity) do
    case Repo.get(UpdateComment, activity.content.comment_id) do
      %UpdateComment{} = comment ->
        case comment.entity_type do
          :project_check_in -> fetch_project_context(comment.entity_id)
          :update -> fetch_goal_context_from_update(comment.entity_id)
          :goal_update -> fetch_goal_context_from_update(comment.entity_id)
          :comment_thread -> fetch_comment_thread_context(comment)
          :project_retrospective -> fetch_project_context_from_retrospective(comment.entity_id)
          :project_task -> fetch_project_context_from_task(comment.entity_id)
          :project_milestone -> fetch_project_context_from_milestone(comment.entity_id)
          :message -> fetch_space_context_from_message(comment.entity_id)
          :resource_hub_document -> fetch_resource_hub_context_from_document(comment.entity_id)
          :resource_hub_file -> fetch_resource_hub_context_from_file(comment.entity_id)
          :resource_hub_link -> fetch_resource_hub_context_from_link(comment.entity_id)
          _ ->
            log_unhandled_comment(activity, comment)
        end

      nil ->
        fetch_comment_deleted_context(activity)
    end
  end

  defp fetch_comment_deleted_context(%Activity{content: %{parent_type: parent_type, parent_id: parent_id}} = activity) do
    case do_fetch_comment_deleted_context(parent_type, parent_id) do
      nil ->
        Logger.error("Unhandled activity: #{inspect(activity)}")
        raise "Activity not handled in context assignment #{activity.action}"

      context_id ->
        context_id
    end
  end

  defp fetch_comment_deleted_context(activity) do
    Logger.error("Unhandled activity: #{inspect(activity)}")
    raise "Activity not handled in context assignment #{activity.action}"
  end

  defp do_fetch_comment_deleted_context(:project_check_in, parent_id), do: fetch_project_context_from_check_in(parent_id)
  defp do_fetch_comment_deleted_context(:project_retrospective, parent_id), do: fetch_project_context_from_retrospective(parent_id)
  defp do_fetch_comment_deleted_context(:project_task, parent_id), do: fetch_project_context_from_task(parent_id)
  defp do_fetch_comment_deleted_context(:project_milestone, parent_id), do: fetch_project_context_from_milestone(parent_id)
  defp do_fetch_comment_deleted_context(:goal_update, parent_id), do: fetch_goal_context_from_update(parent_id)
  defp do_fetch_comment_deleted_context(:update, parent_id), do: fetch_goal_context_from_update(parent_id)
  defp do_fetch_comment_deleted_context(:comment_thread, parent_id), do: fetch_comment_thread_context(%{entity_id: parent_id})
  defp do_fetch_comment_deleted_context(:message, parent_id), do: fetch_space_context_from_message(parent_id)
  defp do_fetch_comment_deleted_context(:resource_hub_document, parent_id), do: fetch_resource_hub_context_from_document(parent_id)
  defp do_fetch_comment_deleted_context(:resource_hub_file, parent_id), do: fetch_resource_hub_context_from_file(parent_id)
  defp do_fetch_comment_deleted_context(:resource_hub_link, parent_id), do: fetch_resource_hub_context_from_link(parent_id)
  defp do_fetch_comment_deleted_context(_, _), do: nil

  defp fetch_comment_thread_context(comment) do
    from(a in Activity,
      join: t in Operately.Comments.CommentThread,
      on: a.id == t.parent_id,
      where: t.id == ^comment.entity_id,
      select: a.access_context_id
    )
    |> Repo.one()
  end

  defp fetch_project_context_from_check_in(check_in_id) do
    from(ci in CheckIn, where: ci.id == ^check_in_id, select: ci.project_id)
    |> Repo.one()
    |> case do
      nil -> fetch_project_context(check_in_id)
      project_id -> fetch_project_context(project_id)
    end
  end

  defp fetch_project_context_from_retrospective(retrospective_id) do
    from(r in Retrospective, where: r.id == ^retrospective_id, select: r.project_id)
    |> Repo.one()
    |> case do
      nil -> fetch_project_context(retrospective_id)
      project_id -> fetch_project_context(project_id)
    end
  end

  defp fetch_project_context_from_task(task_id) do
    from(t in Task, where: t.id == ^task_id, select: t.project_id)
    |> Repo.one()
    |> case do
      nil -> fetch_project_context(task_id)
      project_id -> fetch_project_context(project_id)
    end
  end

  defp fetch_project_context_from_milestone(milestone_id) do
    from(m in Milestone, where: m.id == ^milestone_id, select: m.project_id)
    |> Repo.one()
    |> case do
      nil -> fetch_project_context(milestone_id)
      project_id -> fetch_project_context(project_id)
    end
  end

  defp fetch_goal_context_from_update(update_id) do
    from(u in GoalUpdate, where: u.id == ^update_id, select: u.goal_id)
    |> Repo.one()
    |> case do
      nil -> fetch_goal_context(update_id)
      goal_id -> fetch_goal_context(goal_id)
    end
  end

  defp fetch_space_context_from_message(message_id) do
    from(m in Message,
      join: b in MessagesBoard,
      on: b.id == m.messages_board_id,
      where: m.id == ^message_id,
      select: b.space_id
    )
    |> Repo.one()
    |> case do
      nil -> nil
      space_id -> fetch_space_context(%{content: %{space_id: space_id}})
    end
  end

  defp fetch_resource_hub_context_from_document(document_id) do
    from(d in Document,
      join: n in assoc(d, :node),
      join: hub in assoc(n, :resource_hub),
      where: d.id == ^document_id,
      select: hub.space_id
    )
    |> Repo.one()
    |> case do
      nil -> nil
      space_id -> fetch_resource_hub_context(space_id)
    end
  end

  defp fetch_resource_hub_context_from_file(file_id) do
    from(f in File,
      join: n in assoc(f, :node),
      join: hub in assoc(n, :resource_hub),
      where: f.id == ^file_id,
      select: hub.space_id
    )
    |> Repo.one()
    |> case do
      nil -> nil
      space_id -> fetch_resource_hub_context(space_id)
    end
  end

  defp fetch_resource_hub_context_from_link(link_id) do
    from(l in Link,
      join: n in assoc(l, :node),
      join: hub in assoc(n, :resource_hub),
      where: l.id == ^link_id,
      select: hub.space_id
    )
    |> Repo.one()
    |> case do
      nil -> nil
      space_id -> fetch_resource_hub_context(space_id)
    end
  end

  defp log_unhandled_comment(activity, comment) do
    Logger.error("Unhandled activity: #{inspect(activity)}")
    Logger.error("Comment associated with activity: #{inspect(comment)}")
    raise "Activity not handled in context assignment #{activity.action}"
  end
end
