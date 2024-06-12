defmodule OperatelyWeb.Api.Serializers.Activity do
  alias OperatelyWeb.Api.Serializers.Timeframe
  alias Operately.Activities.Content.GoalEditing

  def serialize(activities) when is_list(activities) do
    Enum.map(activities, &serialize/1)
  end

  def serialize(activity) do
    %{
      id: activity.id,
      inserted_at: activity.inserted_at,
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

  #
  # Serializers for each action
  #

  def serialize_content("comment_added", _content) do
    %{}
  end

  def serialize_content("company_invitation_token_created", _content) do
    %{}
  end

  def serialize_content("company_member_added", _content) do
    %{}
  end

  def serialize_content("company_member_removed", _content) do
    %{}
  end

  def serialize_content("discussion_comment_submitted", _content) do
    %{}
  end

  def serialize_content("discussion_editing", _content) do
    %{}
  end

  def serialize_content("discussion_posting", _content) do
    raise "not implemented"
  end

  def serialize_content("goal_archived", content) do
    %{
      goal: serialize_goal(content["goal"])
    }
  end

  def serialize_content("goal_check_in", _content) do
    raise "not implemented"
  end

  def serialize_content("goal_check_in_acknowledgement", _content) do
    %{}
  end

  def serialize_content("goal_check_in_commented", _content) do
    %{}
  end

  def serialize_content("goal_check_in_edit", _content) do
    %{}
  end

  def serialize_content("goal_closing", content) do
    %{
      goal: serialize_goal(content["goal"]),
      success: content["success"]
    }
  end

  def serialize_content("goal_created", content) do
    %{
      goal: serialize_goal(content["goal"])
    }
  end

  def serialize_content("goal_discussion_creation", content) do
    %{
      goal: serialize_goal(content["goal"])
    }
  end

  def serialize_content("goal_discussion_editing", _content) do
    %{}
  end

  def serialize_content("goal_editing", content) do
    %{
      goal: serialize_goal(content["goal"]),
      new_name: content["new_name"],
      old_name: content["old_name"],
      new_timeframe: Timeframe.serialize(GoalEditing.previous_timeframe(content)),
      old_timeframe: Timeframe.serialize(GoalEditing.current_timeframe(content)),
      new_champion_id: content["new_champion_id"],
      old_champion_id: content["old_champion_id"],
      added_targets: serialize_added_targets(content),
      updated_targets: serialize_updated_targets(content),
      deleted_targets: serialize_deleted_targets(content)
    }
  end

  def serialize_content("goal_reopening", content) do
    %{
      goal: serialize_goal(content["goal"])
    }
  end

  def serialize_content("goal_reparent", _content) do
    %{}
  end

  def serialize_content("goal_timeframe_editing", content) do
    %{
      goal: serialize_goal(content["goal"]),
      new_timeframe: Timeframe.serialize(GoalEditing.previous_timeframe(content)),
      old_timeframe: Timeframe.serialize(GoalEditing.current_timeframe(content))
    }
  end

  def serialize_content("group_edited", _content) do
    %{}
  end

  def serialize_content("password_first_time_changed", _content) do
    %{}
  end

  def serialize_content("project_archived", content) do
    %{
      project: serialize_project(content["project"])
    }
  end

  def serialize_content("project_check_in_acknowledged", content) do
    %{
      project_id: content["project_id"],
      check_in_id: content["check_in_id"],
      project: serialize_project(content["project"])
    }
  end

  def serialize_content("project_check_in_commented", _content) do
    raise "not implemented"
  end

  def serialize_content("project_check_in_edit", _content) do
    %{}
  end

  def serialize_content("project_check_in_submitted", _content) do
    raise "not implemented"
  end

  def serialize_content("project_closed", content) do
    %{
      project: serialize_project(content["project"])
    }
  end

  def serialize_content("project_contributor_addition", _content) do
    raise "not implemented"
  end

  def serialize_content("project_created", content) do
    %{
      project: serialize_project(content["project"])
    }
  end

  def serialize_content("project_discusssion_submitted", _content) do
    raise "not implemented"
  end

  def serialize_content("project_goal_connection", content) do
    %{
      project: serialize_project(content["project"]),
      goal: serialize_goal(content["goal"])
    }
  end

  def serialize_content("project_goal_disconnection", content) do
    %{
      project: serialize_project(content["project"]),
      goal: serialize_goal(content["goal"])
    }
  end

  def serialize_content("project_milestone_commented", _content) do
    raise "not implemented"
  end

  def serialize_content("project_moved", _content) do
    raise "not implemented"
  end

  def serialize_content("project_pausing", content) do
    %{
      project: serialize_project(content["project"])
    }
  end

  def serialize_content("project_renamed", content) do
    %{
      project: serialize_project(content["project"]),
      new_name: content["new_name"],
      old_name: content["old_name"]
    }
  end

  def serialize_content("project_resuming", content) do
    %{
      project: serialize_project(content["project"])
    }
  end

  def serialize_content("project_timeline_edited", _content) do
    raise "not implemented"
  end

  def serialize_content("space_joining", _content) do
    raise "not implemented"
  end

  def serialize_content("task_adding", _content) do
    %{}
  end

  def serialize_content("task_assignee_assignment", _content) do
    %{}
  end

  def serialize_content("task_closing", _content) do
    %{}
  end

  def serialize_content("task_description_change", _content) do
    %{}
  end

  def serialize_content("task_name_editing", _content) do
    %{}
  end

  def serialize_content("task_priority_change", _content) do
    %{}
  end

  def serialize_content("task_reopening", _content) do
    %{}
  end

  def serialize_content("task_size_change", _content) do
    %{}
  end

  def serialize_content("task_status_change", _content) do
    %{}
  end

  def serialize_content("task_update", _content) do
    %{}
  end

  #
  # Utility serializers
  #

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

  def serialize_added_targets(content) do
    Enum.map(content["added_targets"], fn target -> 
      %{id: target["id"], name: target["name"]} 
    end)
  end

  def serialize_updated_targets(content) do
    Enum.map(content["updated_targets"], fn target -> 
      %{id: target["id"], old_name: target["old_name"], new_name: target["new_name"]} 
    end)
  end

  def serialize_deleted_targets(content) do
    Enum.map(content["deleted_targets"], fn target -> 
      %{id: target["id"], name: target["name"]} 
    end)
  end
end
