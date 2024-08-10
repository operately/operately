defmodule OperatelyWeb.Api.Serializers.Activity do
  alias OperatelyWeb.Api.Serializers.Timeframe
  alias Operately.Activities.Content.GoalEditing
  alias OperatelyWeb.Paths

  def serialize(activities) when is_list(activities) do
    Enum.map(activities, fn activity ->
      serialize(activity, [comment_thread: :minimal])
    end)
  end

  def serialize(activity, [comment_thread: comment_thread]) do
    %{
      id: OperatelyWeb.Paths.activity_id(activity),
      inserted_at: activity.inserted_at,
      action: activity.action,
      author: OperatelyWeb.Api.Serializer.serialize(activity.author, level: :essential),
      comment_thread: activity.comment_thread && serialize_comment_thread(activity.comment_thread, comment_thread),
      content: serialize_content(activity.action, activity.content),
    }
  end

  def serialize_comment_thread(comment_thread, :minimal) do
    %{
      id: Operately.ShortUuid.encode!(comment_thread.id),
      message: Jason.encode!(comment_thread.message),
      title: comment_thread.title,
    }
  end

  def serialize_comment_thread(comment_thread, :full) do
    %{
      id: Operately.ShortUuid.encode!(comment_thread.id),
      message: Jason.encode!(comment_thread.message),
      title: comment_thread.title,
      reactions: OperatelyWeb.Api.Serializer.serialize(comment_thread.reactions),
      comments: Enum.map(comment_thread.comments, fn c ->
        %{
          id: c.id,
          content: Jason.encode!(c.content),
          inserted_at: c.inserted_at,
          author: OperatelyWeb.Api.Serializer.serialize(c.author, level: :essential),
          reactions: OperatelyWeb.Api.Serializer.serialize(c.reactions),
        }
      end),
    }
  end

  #
  # Serializers for each action
  #

  def serialize_content("comment_added", content) do
    %{
      comment: serialize_comment(content["comment"]),
      activity: content.activity && serialize(content.activity, [comment_thread: :minimal])
    }
  end

  def serialize_content("company_admin_added", content) do
    %{
      company: OperatelyWeb.Api.Serializer.serialize(content["company"], level: :essential),
      people: content["people"]
    }
  end

  def serialize_content("company_admin_removed", content) do
    %{
      company: OperatelyWeb.Api.Serializer.serialize(content["company"], level: :essential),
      person: OperatelyWeb.Api.Serializer.serialize(content["person"], level: :essential),
    }
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

  def serialize_content("discussion_comment_submitted", content) do
    %{
      space: serialize_space(content["space"]),
      discussion: serialize_discussion(content["discussion"]),
      space_id: Paths.space_id(content["space"]),
      discussion_id: Paths.discussion_id(content["discussion"]),
      title: content["title"]
    }
  end

  def serialize_content("discussion_editing", _content) do
    %{}
  end

  def serialize_content("discussion_posting", content) do
    %{
      space: serialize_space(content["space"]),
      discussion: serialize_discussion(content["discussion"])
    }
  end

  def serialize_content("goal_archived", content) do
    %{
      goal: serialize_goal(content["goal"])
    }
  end

  def serialize_content("goal_check_in", content) do
    %{
      goal: serialize_goal(content["goal"]),
      update: serialize_goal_check_in_update(content["update"])
    }
  end

  def serialize_content("goal_check_in_acknowledgement", content) do
    %{
      goal: serialize_goal(content["goal"]),
      update: serialize_goal_check_in_update(content["update"])
    }
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
      new_champion: OperatelyWeb.Api.Serializer.serialize(content["new_champion"], level: :essential),
      old_champion: OperatelyWeb.Api.Serializer.serialize(content["old_champion"], level: :essential),
      old_reviewer_id: content["old_reviewer_id"],
      new_reviewer_id: content["new_reviewer_id"],
      old_reviewer: OperatelyWeb.Api.Serializer.serialize(content["old_reviewer"], level: :essential),
      new_reviewer: OperatelyWeb.Api.Serializer.serialize(content["new_reviewer"], level: :essential),
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
      new_timeframe: Timeframe.serialize(content["new_timeframe"]),
      old_timeframe: Timeframe.serialize(content["old_timeframe"])
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
      project_id: OperatelyWeb.Paths.project_id(content["project"]),
      check_in_id: OperatelyWeb.Paths.project_check_in_id(content["check_in"]),
      project: serialize_project(content["project"]),
      check_in: serialize_check_in(content["check_in"])
    }
  end

  def serialize_content("project_check_in_commented", content) do
    %{
      project: serialize_project(content["project"]),
      check_in: serialize_check_in(content["check_in"]),
      comment: serialize_comment(content["comment"])
    }
  end

  def serialize_content("project_check_in_edit", _content) do
    %{}
  end

  def serialize_content("project_check_in_submitted", content) do
    %{
      project: serialize_project(content["project"]),
      check_in: serialize_check_in(content["check_in"])
    }
  end

  def serialize_content("project_closed", content) do
    %{
      project: serialize_project(content["project"])
    }
  end

  def serialize_content("project_contributor_addition", content) do
    %{
      person: OperatelyWeb.Api.Serializer.serialize(content["person"], level: :essential),
      project: serialize_project(content["project"])
    }
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

  def serialize_content("project_milestone_commented", content) do
    OperatelyWeb.Api.Serializer.serialize(content)
  end

  def serialize_content("project_moved", content) do
    %{
      project: serialize_project(content["project"]),
      old_space: serialize_space(content["old_space"]),
      new_space: serialize_space(content["new_space"])
    }
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

  def serialize_content("project_timeline_edited", content) do
    %{
      project: OperatelyWeb.Api.Serializer.serialize(content.project),
      old_start_date: OperatelyWeb.Api.Serializer.serialize(content.old_start_date),
      new_start_date: OperatelyWeb.Api.Serializer.serialize(content.new_start_date),
      old_end_date: OperatelyWeb.Api.Serializer.serialize(content.old_end_date),
      new_end_date: OperatelyWeb.Api.Serializer.serialize(content.new_end_date),
      new_milestones: OperatelyWeb.Api.Serializer.serialize(content.new_milestones),
      updated_milestones: OperatelyWeb.Api.Serializer.serialize(content.milestone_updates)
    }
  end

  def serialize_content("space_joining", content) do
    %{
      space: serialize_space(content["space"])
    }
  end

  def serialize_content("space_member_removed", content) do
    %{
      space: serialize_space(content["space"]),
      member: %{id: content["member"].id, full_name: content["member"].full_name},
    }
  end

  def serialize_content("space_members_added", content) do
    %{
      space: serialize_space(content["space"]),
      members: Enum.map(content["members"], fn m -> %{id: m.person_id, full_name: m.person_name} end),
    }
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

  def serialize_project(nil), do: nil
  def serialize_project(project) do
    %{
      id: OperatelyWeb.Paths.project_id(project),
      name: project.name,
    }
  end

  def serialize_goal(nil), do: nil
  def serialize_goal(goal) do
    %{
      id: goal.id,
      name: goal.name,
      my_role: goal.my_role,
    }
  end

  def serialize_space(space) do
    %{
      id: OperatelyWeb.Paths.space_id(space),
      name: space.name,
    }
  end

  def serialize_discussion(discussion) do
    %{
      id: OperatelyWeb.Paths.discussion_id(discussion),
      title: discussion.content["title"],
      body: discussion.content["body"],
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

  def serialize_check_in(check_in) do
    %{
      id: OperatelyWeb.Paths.project_check_in_id(check_in),
      inserted_at: check_in.inserted_at,
      status: check_in.status,
      description: check_in.description
    }
  end

  defp serialize_goal_check_in_update(update) do
    %{
      id: OperatelyWeb.Paths.goal_update_id(update),
      title: update.title,
      message: Jason.encode!(update.content["message"]),
      message_type: update.type || "status_update",
      updatable_id: update.updatable_id,
      updatable_type: update.updatable_type,
      inserted_at: update.inserted_at,
      comments_count: Operately.Updates.count_comments(update.id, :update),
      content: %{
        "__typename" => "UpdateContentGoalCheckIn",

        targets: update.content["targets"] && Enum.map(update.content["targets"], fn target ->
          %{
            id: target["id"],
            name: target["name"],
            value: target["value"],
            previous_value: target["previous_value"],
            unit: target["unit"],
            from: target["from"],
            to: target["to"]
          }
        end)
      }
    }
  end

  defp serialize_comment(nil), do: nil
  defp serialize_comment(comment) do
    %{
      id: comment.id,
      content: Jason.encode!(comment.content),
      inserted_at: comment.inserted_at,
    }
  end
end
