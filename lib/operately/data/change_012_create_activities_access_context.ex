defmodule Operately.Data.Change011CreateActivitiesAccessContext do
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Activities.Activity

  def run do
    Repo.transaction(fn ->
      Activity
      |> Repo.all()
      |> Enum.map(&Activities.cast_content/1)
      |> assign_context()
    end)
  end

  def assign_context(activities) when is_list(activities) do
    Enum.each(activities, &assign_context/1)
  end

  def assign_context(activity) do
    context = cond do
      activity.action in @project_actions -> assign_project_context(activity)
      activity.action in @goal_actions -> assign_goal_context(activity)
      activity.action in @task_actions -> assign_task_project_context(activity)
    end
  end

  def assign_project_context(activity) do
    project = Operately.Projects.get_project!(activity.content.project_id)
    context = Repo.preload(project, :access_context).access_context

    {:ok, _} = Repo.update(Activities.change_activity(activity, activity_context_id: context.id))
  end

  def assign_goal_context(activity) do

  end

  def assign_task_project_context(activity) do

  end

  # TODO
  # :comment_added,
  # :goal_reparent,
  # :project_created,


  @company_actions [
    :password_first_time_changed,
    :company_invitation_token_created,
    :company_member_added,
    :company_member_removed,
  ]

  @group_actions [
    :group_edited,
  ]

  @space_actions [
    :space_joining,

    :discussion_posting,
    :discussion_editing,
    :discussion_comment_submitted,

    :task_assignee_assignment,
    :task_description_change,
    :task_name_editing,
    :task_priority_change,
    :task_reopening,
    :task_size_change,
  ]

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
    :task_closing,
    :task_status_change,
    :task_update,
  ]
end
