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
      id: activity.id,
      inserted_at: activity.inserted_at,
      action: activity.action,
      author: serialize_author(activity.author),
      comment_thread: activity.comment_thread && serialize_comment_thread(activity.comment_thread, comment_thread),
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

  def serialize_comment_thread(comment_thread, :minimal) do
    %{
      id: comment_thread.id,
      message: Jason.encode!(comment_thread.message),
      title: comment_thread.title,
    }
  end

  def serialize_comment_thread(comment_thread, :full) do
    %{
      id: comment_thread.id,
      message: Jason.encode!(comment_thread.message),
      title: comment_thread.title,
      reactions: Enum.map(comment_thread.reactions, fn r ->
        %{
          id: r.id,
          emoji: r.emoji,
          person: serialize_person(r.person)
        }
      end),
      comments: Enum.map(comment_thread.comments, fn c ->
        %{
          id: c.id,
          content: Jason.encode!(c.content),
          inserted_at: c.inserted_at,
          author: serialize_person(c.author),
          reactions: Enum.map(c.reactions, fn r ->
            %{
              id: r.id,
              emoji: r.emoji,
              person: serialize_person(r.person)
            }
          end)
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
      new_champion: serialize_person(content["new_champion"]),
      old_champion: serialize_person(content["old_champion"]),
      old_reviewer_id: content["old_reviewer_id"],
      new_reviewer_id: content["new_reviewer_id"],
      old_reviewer: serialize_person(content["old_reviewer"]),
      new_reviewer: serialize_person(content["new_reviewer"]),
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
      person: serialize_person(content["person"]),
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
    %{
      comment: serialize_comment(content["comment"]),
      comment_action: content["comment_action"],
      milestone: %{
        id: content["milestone"].id,
        title: content["milestone"].title,
      },
      project: serialize_project(content["project"]),
      project_id: OperatelyWeb.Paths.project_id(content["project"]),
    }
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
      project: serialize_project(content["project"]),
      old_start_date: serialize_date(content["old_start_date"]),
      new_start_date: serialize_date(content["new_start_date"]),
      old_end_date: serialize_date(content["old_end_date"]),
      new_end_date: serialize_date(content["new_end_date"]),
      new_milestones: serialize_new_milestones(content["new_milestones"]),
      updated_milestones: serialize_updated_milestones(content["milestone_updates"])
    }
  end

  def serialize_content("space_joining", content) do
    %{
      space: serialize_space(content["space"])
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

  def serialize_new_milestones(nil), do: []
  def serialize_new_milestones(milestones) do
    Enum.map(milestones, fn milestone -> 
      %{id: 
        milestone["milestone_id"], 
        title: milestone["title"], 
        deadline_at: serialize_date(milestone["due_date"])
      }
    end)
  end

  def serialize_updated_milestones(nil), do: []
  def serialize_updated_milestones(milestones) do
    Enum.map(milestones, fn milestone -> 
      %{
        id: milestone["milestone_id"], 
        title: milestone["new_title"], 
        deadline_at: serialize_date(milestone["new_due_date"])
      }
    end)
  end

  def serialize_check_in(check_in) do
    %{
      id: check_in.id,
      inserted_at: check_in.inserted_at,
      status: check_in.status,
      description: check_in.description
    }
  end

  defp serialize_person(nil), do: nil
  defp serialize_person(person) do
    %{
      id: person.id,
      full_name: person.full_name,
      avatar_url: person.avatar_url,
      title: person.title
    }
  end

  defp serialize_goal_check_in_update(update) do
    %{
      id: update.id,
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

  defp serialize_date(nil), do: nil
  defp serialize_date(date) do
    date |> DateTime.to_date()
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
