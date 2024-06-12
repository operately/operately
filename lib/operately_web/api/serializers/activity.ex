defmodule OperatelyWeb.Api.Serializers.Activity do
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

  def serialize_content("goal_editing", content) do
    alias Operately.Activities.Content.GoalEditing
    alias Operately.Api.Serializers.Timeframe

    %{}
    |> serialize_project_on_content(content)
    |> serialize_goal_on_content(content)
    # |> Map.merge(%{
    #   new_name: content["new_name"],
    #   old_name: content["old_name"],
    #   new_timeframe: Timeframe.serialize(GoalEditing.previous_timeframe(content),
    #   old_timeframe: Timeframe.serialize(GoalEditing.current_timeframe(content),
    #   new_champion_id: content["new_champion_id"],
    #   old_champion_id: content["old_champion_id"],
    #   added_targets: Enum.map(content["added_targets"], fn target -> %{id: target["id"], name: target["name"]} end),
    #   updated_targets: Enum.map(content["updated_targets"], fn target -> %{id: target["id"], old_name: target["old_name"], new_name: target["new_name"]} end),
    #   deleted_targets: Enum.map(content["deleted_targets"], fn target -> %{id: target["id"], name: target["name"]} end)
    # })
  end

  def serialize_content(_action, content) do
    %{}
    |> serialize_project_on_content(content)
    |> serialize_goal_on_content(content)
  end

  def serialize_project_on_content(res, content) do
    if content["project_id"] do
      Map.put(res, "project", serialize_project(content["project"]))
    else
      res
    end
  end

  def serialize_goal_on_content(res, content) do
    if content["goal"] do
      Map.put(res, "goal", serialize_goal(content["goal"]))
    else
      res
    end
  end

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
end
