defmodule Operately.MD.Goal.Timeframe do
  def render(goal) do
    timeframe_activities = load_timeframe_activities(goal.id)

    """
    ## Timeframe

    Start Date: #{render_contextual_date(goal.timeframe && goal.timeframe.contextual_start_date)}
    Due Date: #{render_contextual_date(goal.timeframe && goal.timeframe.contextual_end_date)}

    ### Timeframe History

    #{render_timeframe_history(timeframe_activities)}
    """
  end

  defp render_contextual_date(nil), do: "Not Set"
  defp render_contextual_date(date), do: date.value

  defp load_timeframe_activities(goal_id) do
    import Ecto.Query

    timeframe_actions = [
      "goal_due_date_updating",
      "goal_start_date_updating"
    ]

    from(a in Operately.Activities.Activity,
      where: fragment("? ->> ? = ?", a.content, "goal_id", ^goal_id),
      where: a.action in ^timeframe_actions,
      order_by: [desc: a.inserted_at],
      preload: [:author]
    )
    |> Operately.Repo.all()
    |> Enum.map(&Operately.Activities.cast_content/1)
  end

  defp render_timeframe_history([]) do
    "_No timeframe changes recorded._"
  end

  defp render_timeframe_history(activities) do
    activities
    |> Enum.map(&render_timeframe_activity/1)
    |> Enum.join("\n\n")
  end

  defp render_timeframe_activity(%{action: "goal_due_date_updating"} = activity) do
    content = activity.content
    author = activity.author.full_name
    date = render_date(activity.inserted_at)

    old_date = render_activity_date(content.old_due_date)
    new_date = render_activity_date(content.new_due_date)

    "**#{date}** - #{author} changed the due date from #{old_date} to #{new_date}"
  end

  defp render_timeframe_activity(%{action: "goal_start_date_updating"} = activity) do
    content = activity.content
    author = activity.author.full_name
    date = render_date(activity.inserted_at)

    old_date = render_activity_date(content.old_start_date)
    new_date = render_activity_date(content.new_start_date)

    "**#{date}** - #{author} changed the start date from #{old_date} to #{new_date}"
  end

  defp render_timeframe_activity(activity) do
    # Fallback for any other timeframe-related activities
    author = activity.author.full_name
    date = render_date(activity.inserted_at)
    "**#{date}** - #{author} made a timeframe change"
  end

  defp render_activity_date(nil), do: "Not Set"

  defp render_activity_date(%Date{} = date), do: Date.to_iso8601(date)

  defp render_activity_date(date) when is_binary(date) do
    # Handle ISO date strings
    case Date.from_iso8601(date) do
      {:ok, parsed_date} -> Date.to_iso8601(parsed_date)
      {:error, _} -> date
    end
  end

  defp render_activity_date(date), do: inspect(date)

  defp render_date(d) do
    Operately.Time.as_date(d) |> Date.to_iso8601()
  end
end
