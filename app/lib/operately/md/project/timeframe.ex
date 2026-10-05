defmodule Operately.MD.Project.Timeframe do
  use Gettext, backend: OperatelyWeb.Gettext
  def render(project) do
    tf = project.timeframe
    timeframe_activities = load_timeframe_activities(project.id)

    """
    ## #{gettext("Timeframe")}

    #{gettext("Start Date")}: #{render_contextual_date(tf && tf.contextual_start_date)}
    #{gettext("Due Date")}: #{render_contextual_date(tf && tf.contextual_end_date)}

    ### #{gettext("Timeframe History")}

    #{render_timeframe_history(timeframe_activities)}
    """
  end

  defp render_contextual_date(nil), do: gettext("Not Set")
  defp render_contextual_date(date), do: date.value

  defp load_timeframe_activities(project_id) do
    import Ecto.Query

    timeframe_actions = [
      "project_due_date_updating",
      "project_start_date_updating",
      "project_timeline_edited"
    ]

    from(a in Operately.Activities.Activity,
      where: fragment("? ->> ? = ?", a.content, "project_id", ^project_id),
      where: a.action in ^timeframe_actions,
      order_by: [desc: a.inserted_at],
      preload: [:author]
    )
    |> Operately.Repo.all()
    |> Enum.map(&Operately.Activities.cast_content/1)
  end

  defp render_timeframe_history([]) do
    gettext("_No timeframe changes recorded._")
  end

  defp render_timeframe_history(activities) do
    activities
    |> Enum.map(&render_timeframe_activity/1)
    |> Enum.join("\n\n")
  end

  defp render_timeframe_activity(%{action: "project_due_date_updating"} = activity) do
    content = activity.content
    author = activity.author.full_name
    date = render_date(activity.inserted_at)

    old_date = render_activity_date(content.old_due_date)
    new_date = render_activity_date(content.new_due_date)

    gettext("**%{date}** - %{author} changed the due date from %{old_date} to %{new_date}", date: date, author: author, old_date: old_date, new_date: new_date)
  end

  defp render_timeframe_activity(%{action: "project_start_date_updating"} = activity) do
    content = activity.content
    author = activity.author.full_name
    date = render_date(activity.inserted_at)

    old_date = render_activity_date(content.old_start_date)
    new_date = render_activity_date(content.new_start_date)

    gettext("**%{date}** - %{author} changed the start date from %{old_date} to %{new_date}", date: date, author: author, old_date: old_date, new_date: new_date)
  end

  defp render_timeframe_activity(%{action: "project_timeline_edited"} = activity) do
    content = activity.content
    author = activity.author.full_name
    date = render_date(activity.inserted_at)

    start_changed? = content.old_start_date != content.new_start_date
    due_changed? = content.old_end_date != content.new_end_date

    cond do
      start_changed? and due_changed? ->
        gettext("**%{date}** - %{author} changed the start date from %{old_start} to %{new_start} and due date from %{old_due} to %{new_due}",
          date: date, author: author,
          old_start: render_activity_date(content.old_start_date), new_start: render_activity_date(content.new_start_date),
          old_due: render_activity_date(content.old_end_date), new_due: render_activity_date(content.new_end_date))
      start_changed? ->
        gettext("**%{date}** - %{author} changed the start date from %{old_date} to %{new_date}", date: date, author: author,
          old_date: render_activity_date(content.old_start_date), new_date: render_activity_date(content.new_start_date))
      due_changed? ->
        gettext("**%{date}** - %{author} changed the due date from %{old_date} to %{new_date}", date: date, author: author,
          old_date: render_activity_date(content.old_end_date), new_date: render_activity_date(content.new_end_date))
      true ->
        gettext("**%{date}** - %{author} updated the project timeline", date: date, author: author)
    end
  end

  defp render_timeframe_activity(activity) do
    # Fallback for any other timeframe-related activities
    author = activity.author.full_name
    date = render_date(activity.inserted_at)
    gettext("**%{date}** - %{author} made a timeframe change", date: date, author: author)
  end

  defp render_activity_date(nil), do: gettext("Not Set")

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
