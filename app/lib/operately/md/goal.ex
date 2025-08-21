defmodule Operately.MD.Goal do
  def render(goal) do
    goal = Operately.Repo.preload(goal, updates: [:author], targets: [], checks: [], group: [], parent_goal: [], projects: [], champion: [], reviewer: [])
    discussions = Operately.Goals.Discussion.list(goal.id)

    """
    # #{goal.name}

    #{render_overview_info(goal)}
    #{render_description(goal)}
    #{render_people(goal)}
    #{render_timeframe(goal)}
    #{render_targets(goal.targets)}
    #{Operately.MD.Goal.Checklist.render(goal)}
    #{render_projects(goal.projects)}
    #{render_check_ins(goal.updates, goal.id)}
    #{Operately.MD.Goal.Discussions.render(discussions)}
    #{Operately.MD.Goal.Activities.render(goal.id)}
    #{render_retrospective(goal.retrospective)}
    """
    |> compact_empty_lines()
  end

  defp render_overview_info(goal) do
    """
    Status: #{Operately.Goals.Goal.status(goal)}
    Progress: #{Operately.Goals.Goal.progress_percentage(goal)}%
    Space: #{goal.group.name}
    Created: #{render_date(goal.inserted_at)}
    Last Updated: #{render_date(goal.updated_at)}
    """
    |> then(fn info ->
      if goal.closed_at do
        info <> "Closed At: #{render_date(goal.closed_at)}"
      else
        info
      end
    end)
    |> then(fn info ->
      if goal.deleted_at do
        info <> "Archived At: #{render_date(goal.deleted_at)}"
      else
        info
      end
    end)
    |> then(fn info ->
      if goal.parent_goal do
        info <> "Parent Goal: #{goal.parent_goal.name}"
      else
        info <> "Parent Goal: None (Top Level Goal)"
      end
    end)
    |> then(fn info -> info <> "\n\n" end)
  end

  defp render_description(goal) do
    if goal.description do
      """
      ## Description

      #{Operately.MD.RichText.render(goal.description)}
      """
    else
      """
      ## Description

      _No description provided._
      """
    end
  end

  defp render_date(d) do
    Operately.Time.as_date(d) |> Date.to_iso8601()
  end

  defp render_targets([]) do
    """
    ## Targets

    _No targets defined._
    """
  end

  defp render_targets(targets) do
    """
    ## Targets

    #{targets |> Enum.sort_by(& &1.index) |> Enum.map_join("\n", fn target ->
      progress = calculate_target_progress(target)

      """
      #{target.index + 1}. #{target.name}
        - Current Value: #{target.value} #{target.unit}
        - Target: #{target.to} #{target.unit}
        - Starting From: #{target.from} #{target.unit}
        - Progress: #{progress}%"
      """
    end)}
    """
  end

  defp calculate_target_progress(%{value: value, from: from, to: to}) when from != to do
    progress = (value - from) / (to - from) * 100
    Float.round(progress, 1)
  end

  defp calculate_target_progress(_), do: 0.0

  defp render_check_ins(check_ins, goal_id) do
    if check_ins == [] do
      """
      ## Check-ins

      _No check-ins yet._
      """
    else
      """
      ## Check-ins

      #{Enum.map_join(check_ins, "\n\n", &render_check_in(&1, goal_id))}
      """
    end
  end

  defp render_check_in(check_in, goal_id) do
    comments = get_check_in_comments(check_in.id, goal_id)
    targets_diff = get_targets_diff(check_in)
    
    """
    ### Check-in on #{render_date(check_in.inserted_at)}

    #{render_person("Author", check_in.author)}

    #{Operately.MD.RichText.render(check_in.message)}
    #{targets_diff}
    #{render_check_in_comments(comments)}
    """
  end

  defp get_check_in_comments(check_in_id, goal_id) do
    import Ecto.Query, only: [from: 2, where: 3]
    
    from(a in Operately.Activities.Activity,
      where: a.resource_id == ^goal_id,
      where: a.action == "goal_check_in_commented",
      where: fragment("?->>'goal_check_in_id' = ?", a.content, ^to_string(check_in_id)),
      preload: [:author],
      order_by: [asc: a.inserted_at]
    )
    |> Operately.Repo.all()
  end

  defp render_check_in_comments([]), do: ""
  defp render_check_in_comments(comments) do
    """

    #### Comments
    #{Enum.map_join(comments, "\n", &render_check_in_comment/1)}
    """
  end

  defp render_check_in_comment(activity) do
    timestamp = format_timestamp(activity.inserted_at)
    author = activity.author.full_name
    "- **#{timestamp}** - Comment by #{author}"
  end

  defp get_targets_diff(check_in) do
    case check_in.targets do
      nil -> ""
      [] -> ""
      targets when is_list(targets) ->
        """

        #### Target Updates
        #{Enum.map_join(targets, "\n", &render_target_diff/1)}
        """
    end
  end

  defp render_target_diff(target) do
    old_value = Map.get(target, "previous_value", "N/A")
    new_value = Map.get(target, "value", "N/A")
    name = Map.get(target, "name", "Unknown Target")
    "- #{name}: #{old_value} → #{new_value}"
  end

  defp format_timestamp(datetime) do
    datetime
    |> Operately.Time.as_date()
    |> Date.to_iso8601()
  end

  defp render_retrospective(retrospective) do
    if retrospective do
      """
      ## Retrospective

      #{Operately.MD.RichText.render(retrospective.content)}
      """
    else
      ""
    end
  end

  defp render_people(goal) do
    """
    ## People Involved

    #{render_person("Champion", goal.champion)}
    #{render_person("Reviewer", goal.reviewer)}
    """
  end

  defp render_timeframe(goal) do
    """
    ## Timeframe

    Start Date: #{render_contextual_date(goal.timeframe.contextual_start_date)}
    Due Date: #{render_contextual_date(goal.timeframe.contextual_end_date)}
    """
  end

  defp render_contextual_date(nil), do: "Not Set"
  defp render_contextual_date(date), do: date.value

  defp render_person(role, person) do
    if person do
      "#{role}: #{person.full_name} (#{person.title})"
    else
      "#{role}: Not Assigned"
    end
  end

  defp render_projects([]), do: ""

  defp render_projects(projects) when is_list(projects) do
    """
    ## Related Projects

    #{Enum.map_join(projects, "\n", fn project -> "- #{project.name} (ID: #{project.id})" end)}
    """
  end

  defp compact_empty_lines(text) do
    text |> String.replace(~r/\n{3,}/, "\n\n")
  end
end
