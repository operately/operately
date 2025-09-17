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
    #{Operately.MD.Goal.CheckIns.render(goal.updates)}
    #{Operately.MD.Goal.Discussions.render(discussions)}
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

    """
    |> then(fn msg ->
      if goal.champion do
        msg <> "\n" <> "Champion: #{goal.champion.full_name} (#{goal.champion.title})"
      else
        msg <> "\n" <> "Champion: Not Assigned"
      end
    end)
    |> then(fn msg ->
      if goal.reviewer do
        msg <> "\n" <> "Reviewer: #{goal.reviewer.full_name} (#{goal.reviewer.title})"
      else
        msg <> "\n" <> "Reviewer: Not Assigned"
      end
    end)
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
