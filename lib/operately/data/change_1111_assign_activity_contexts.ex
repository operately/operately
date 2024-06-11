defmodule Example do

  def run do
    Operately.Repo.transaction(fn ->
      Operately.Activities.Activity
      |> Operately.Repo.all()
      |> Enum.map(&Operately.Activities.cast_content/1)
      |> assign_activity_context()
    end)
  end

  def assign_activity_context(activities) when is_list(activities) do
    Enum.each(activities, &assign_activity_context/1)
  end

  @goal_actions [
    :goal_archived,
    :goal_check_in,
    :goal_check_in_acknowledgement,
    :goal_check_in_commented,
    :goal_check_in_edit,
    :goal_closing,
    :goal_created,
    :goal_discussion_creation,
    :goal_discussion_editing,
    :goal_editing,
    :goal_reopening,
    :goal_reparent,
    :goal_timeframe_editing,
  ]

  @project_actions [
    :project_archived,
    :project_check_in_acknowledged,
    :project_check_in_commented,
    :project_check_in_edit,
    :project_check_in_submitted,
    :project_closed,
    :project_contributor_addition,
    :project_created,
    :project_discusssion_submitted,
    :project_goal_connection,
    :project_goal_disconnection,
    :project_milestone_commented,
    :project_moved,
    :project_pausing,
    :project_renamed,
    :project_resuming,
    :project_timeline_edited,
  ]

  @task_actions [
    :task_adding,
    :task_assignee_assignment,
    :task_closing,
    :task_description_change,
    :task_name_editing,
    :task_priority_change,
    :task_reopening,
    :task_size_change,
    :task_status_change,
    :task_update,
  ]

  def assign_activity_context(activity) do
    context = cond do
      activity.action in @project_actions -> assign_project_context(activity) 
      activity.action in @goal_actions -> assign_goal_context(activity)
      activity.action in @task_actions -> assign_task_project_context(activity)
    end
  end

  def assign_project_context(activity) do
    project = Operately.Projects.get_project!(activity.content.project_id)
    context = Operately.Repo.preload(project, :access_context).access_context

    {:ok, _} = Operately.Repo.update(Operately.Activities.change_activity(activity, activity_context_id: context.id))
  end

  # TODO
  # :comment_added,
  # :company_invitation_token_created,
  # :company_member_added,
  # :company_member_removed,

  # :discussion_comment_submitted,
  # :discussion_editing,
  # :discussion_posting,

  # :password_first_time_changed,

  # :group_edited,
  # :space_joining,

end
