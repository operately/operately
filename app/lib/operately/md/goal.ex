defmodule Operately.MD.Goal do
  def render(goal) do
    """
    # #{goal.name}

    **Status:** #{Operately.Goals.Goal.status(goal)}
    **Progress:** #{Operately.Goals.Goal.progress_percentage(goal)}%
    #{if goal.group, do: "**Space:** #{goal.group.name}  ", else: ""}
    **Privacy:** #{String.capitalize(goal.privacy || "unknown")}

    #{if goal.description, do: "## Description\n\n#{goal.description}\n", else: ""}
    ## People

    #{format_people(goal)}

    ## Timeframe

    **Start Date:** #{format_date(goal.timeframe.contextual_start_date)}
    **End Date:** #{format_date(goal.timeframe.contextual_end_date)}

    #{if goal.next_update_scheduled_at, do: "**Next Update Scheduled:** #{format_datetime(goal.next_update_scheduled_at)}\n", else: ""}
    ## Targets

    #{format_targets(goal.targets)}

    #{format_projects(goal.projects)}

    ## Status Information

    - **Created:** #{format_datetime(goal.inserted_at)}
    - **Last Updated:** #{format_datetime(goal.updated_at)}
    - **Is Closed:** #{goal.closed_at != nil}
    - **Is Archived:** #{goal.deleted_at != nil}
    - **Is Outdated:** #{Operately.Goals.outdated?(goal)}
    #{if goal.closed_at, do: "- **Closed At:** #{format_datetime(goal.closed_at)}", else: ""}
    #{if goal.deleted_at, do: "- **Archived At:** #{format_datetime(goal.deleted_at)}", else: ""}

    #{if goal.last_update, do: format_last_check_in(goal.last_update), else: ""}
    #{if goal.retrospective, do: format_retrospective(goal.retrospective), else: ""}
    """
  end

  defp format_date(%{value: value}) do
    "#{value}"
  end

  defp format_datetime(d = %DateTime{}), do: DateTime.to_iso8601(d)
  defp format_datetime(d = %NaiveDateTime{}), do: NaiveDateTime.to_iso8601(d)

  defp format_targets([]), do: "_No targets defined._"

  defp format_targets(targets) do
    targets
    |> Enum.sort_by(& &1.index)
    |> Enum.map_join("\n", fn target ->
      progress = calculate_target_progress(target)
      "#{target.index + 1}. **#{target.name}**
         - Current Value: #{target.value} #{target.unit}
         - Target: #{target.to} #{target.unit}
         - Starting From: #{target.from} #{target.unit}
         - Progress: #{progress}%"
    end)
  end

  defp calculate_target_progress(%{value: value, from: from, to: to}) when from != to do
    progress = (value - from) / (to - from) * 100
    Float.round(progress, 1)
  end

  defp calculate_target_progress(_), do: 0.0

  defp format_last_check_in(nil), do: ""

  defp format_last_check_in(check_in) do
    """
    ## Last Check-in

    #{check_in}
    """
  end

  defp format_retrospective(nil), do: ""

  defp format_retrospective(retrospective) do
    """
    ## Retrospective

    #{retrospective}
    """
  end

  defp format_people(goal) do
    champion_info = format_person("Champion", goal.champion)
    reviewer_info = format_person("Reviewer", goal.reviewer)

    [champion_info, reviewer_info]
    |> Enum.filter(&(&1 != ""))
    |> Enum.join("\n")
    |> case do
      "" -> "_No people assigned._"
      info -> info
    end
  end

  defp format_person(_role, nil), do: ""

  defp format_person(role, person) do
    "**#{role}:** #{person.full_name} (#{person.title})"
  end

  defp format_projects([]), do: ""

  defp format_projects(projects) when is_list(projects) do
    """
    ## Related Projects

    #{Enum.map_join(projects, "\n", fn project -> "- #{project.name} (ID: #{project.id})" end)}
    """
  end
end
