defmodule Operately.MD.Goal do
  def render(goal) do
    goal =
      Operately.Repo.preload(goal,
        updates: [:author],
        targets: [],
        checks: [],
        group: [],
        parent_goal: [],
        projects: [],
        champion: [],
        reviewer: []
      )
      |> Operately.Goals.Goal.load_retrospective()

    discussions = Operately.Goals.Discussion.list(goal.id)

    """
    # #{goal.name}

    #{render_overview_info(goal)}
    #{render_description(goal)}
    #{render_people(goal)}
    #{Operately.MD.Goal.Timeframe.render(goal)}
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
    [
      "Status: #{Operately.Goals.Goal.status(goal)}",
      render_progress_line(goal),
      render_space_line(goal),
      "Created: #{render_date(goal.inserted_at)}",
      "Last Updated: #{render_date(goal.updated_at)}",
      render_closed_at_line(goal),
      render_archived_at_line(goal),
      render_parent_goal_line(goal)
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.join("\n")
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

  defp render_targets(targets) when not is_list(targets), do: ""

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
    lines =
      [
        render_person_line("Champion", goal.champion_id, goal.champion),
        render_person_line("Reviewer", goal.reviewer_id, goal.reviewer)
      ]
      |> Enum.reject(&is_nil/1)

    if lines == [] do
      ""
    else
      """
      ## People Involved

      #{Enum.join(lines, "\n")}
      """
    end
  end

  defp render_projects([]), do: ""

  defp render_projects(projects) when not is_list(projects), do: ""

  defp render_projects(projects) when is_list(projects) do
    """
    ## Related Projects

    #{Enum.map_join(projects, "\n", fn project -> "- #{project.name} (ID: #{project.id})" end)}
    """
  end

  defp compact_empty_lines(text) do
    text |> String.replace(~r/\n{3,}/, "\n\n")
  end

  defp render_progress(goal) when is_list(goal.targets) and is_list(goal.checks), do: "#{Operately.Goals.Goal.progress_percentage(goal)}%"
  defp render_progress(_goal), do: nil

  defp render_progress_line(goal) do
    case render_progress(goal) do
      nil -> nil
      progress -> "Progress: #{progress}"
    end
  end

  defp render_space(goal), do: render_loaded_association(goal.group, & &1.name)

  defp render_space_line(goal) do
    case render_space(goal) do
      nil -> nil
      space -> "Space: #{space}"
    end
  end

  defp render_parent_goal(%{parent_goal_id: nil}), do: "None (Top Level Goal)"
  defp render_parent_goal(goal), do: render_loaded_association(goal.parent_goal, & &1.name)

  defp render_parent_goal_line(goal) do
    case render_parent_goal(goal) do
      nil -> nil
      parent_goal -> "Parent Goal: #{parent_goal}"
    end
  end

  defp render_closed_at_line(%{closed_at: nil}), do: nil
  defp render_closed_at_line(goal), do: "Closed At: #{render_date(goal.closed_at)}"

  defp render_archived_at_line(%{deleted_at: nil}), do: nil
  defp render_archived_at_line(goal), do: "Archived At: #{render_date(goal.deleted_at)}"

  defp render_person_line(label, nil, _person), do: "#{label}: Not Assigned"

  defp render_person_line(label, _id, person) do
    case render_loaded_association(person, fn person -> "#{person.full_name} (#{person.title})" end) do
      nil -> nil
      value -> "#{label}: #{value}"
    end
  end

  defp render_loaded_association(association, formatter) do
    cond do
      not Ecto.assoc_loaded?(association) ->
        nil

      is_nil(association) ->
        nil

      true ->
        formatter.(association)
    end
  end
end
