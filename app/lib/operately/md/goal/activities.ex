defmodule Operately.MD.Goal.Activities do
  @moduledoc """
  Renders goal-related activities with timestamps for markdown export.
  """

  import Ecto.Query, only: [from: 2, where: 3]
  
  def render(goal_id) do
    activities = fetch_goal_activities(goal_id)
    
    if Enum.empty?(activities) do
      ""
    else
      """
      ## Activity Timeline

      #{Enum.map_join(activities, "\n", &render_activity/1)}
      """
    end
  end

  defp fetch_goal_activities(goal_id) do
    from(a in Operately.Activities.Activity,
      where: a.resource_id == ^goal_id,
      where: a.action in [
        "goal_check_toggled",
        "goal_check_in_commented", 
        "goal_timeframe_editing"
      ],
      preload: [:author],
      order_by: [desc: a.inserted_at]
    )
    |> Operately.Repo.all()
  end

  defp render_activity(activity) do
    timestamp = format_timestamp(activity.inserted_at)
    author = activity.author.full_name
    
    case activity.action do
      "goal_check_toggled" ->
        content = activity.content
        status = if content["completed"], do: "completed", else: "unchecked"
        "- **#{timestamp}** - #{author} #{status} checklist item \"#{content["name"]}\""
        
      "goal_check_in_commented" ->
        "- **#{timestamp}** - #{author} commented on a check-in"
        
      "goal_timeframe_editing" ->
        content = activity.content
        old_due_date = get_due_date(content["old_timeframe"])
        new_due_date = get_due_date(content["new_timeframe"])
        "- **#{timestamp}** - #{author} changed due date from #{old_due_date || "unset"} to #{new_due_date || "unset"}"
        
      _ ->
        "- **#{timestamp}** - #{author} performed #{activity.action}"
    end
  end

  defp format_timestamp(datetime) do
    datetime
    |> Operately.Time.as_date()
    |> Date.to_iso8601()
  end

  defp get_due_date(%{"contextual_end_date" => %{"value" => date}}) when is_binary(date), do: date
  defp get_due_date(_), do: nil
end