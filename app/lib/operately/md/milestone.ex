defmodule Operately.MD.Milestone do
  def render(milestone) do
    milestone = Operately.Repo.preload(milestone, [:project, :creator, :space, [tasks: [:assigned_people]]])

    """
    # #{milestone.title}

    #{render_overview_info(milestone)}
    #{render_description(milestone)}
    #{render_tasks(milestone.tasks || [])}
    """
    |> compact_empty_lines()
  end

  defp render_overview_info(milestone) do
    """
    Status: #{milestone.status}
    Phase: #{milestone.phase}
    Project: #{render_project(milestone)}
    Space: #{render_space(milestone)}
    Creator: #{render_creator(milestone)}
    Created: #{render_date(milestone.inserted_at)}
    Last Updated: #{render_date(milestone.updated_at)}
    Due: #{render_due_date(milestone)}
    """
    |> then(fn info ->
      if milestone.completed_at do
        info <> "Completed At: #{render_date(milestone.completed_at)}"
      else
        info
      end
    end)
    |> then(fn info -> info <> "\n\n" end)
  end

  defp render_description(milestone) do
    description = Operately.MD.RichText.render(milestone.description)

    if description == "" do
      """
      ## Description

      _No description provided._
      """
    else
      """
      ## Description

      #{description}
      """
    end
  end

  defp render_tasks(tasks) when not is_list(tasks) do
    """
    ## Tasks

    _Not loaded._
    """
  end

  defp render_tasks([]) do
    """
    ## Tasks

    _No tasks yet._
    """
  end

  defp render_tasks(tasks) do
    """
    ## Tasks

    #{tasks |> Enum.sort_by(&(&1.inserted_at || ~N[0001-01-01 00:00:00])) |> Enum.map_join("\n", &render_task_line/1)}
    """
  end

  defp render_task_line(task) do
    status = (task.task_status && (task.task_status.label || task.task_status.value)) || "Not set"

    "- #{task.name} | Status: #{status} | Assigned to: #{render_task_assignees(task.assigned_people)} | Due: #{render_task_due_date(task.due_date)}"
  end

  defp render_task_assignees(people) when is_list(people) and length(people) > 0 do
    people |> Enum.map(& &1.full_name) |> Enum.join(", ")
  end

  defp render_task_assignees(people) when is_list(people), do: "Unassigned"
  defp render_task_assignees(_), do: "Not loaded"

  defp render_task_due_date(nil), do: "Not set"
  defp render_task_due_date(%Operately.ContextualDates.ContextualDate{date: date}), do: render_date(date)

  defp render_due_date(milestone) do
    case Operately.ContextualDates.Timeframe.end_date(milestone.timeframe) do
      nil -> "Not set"
      date -> render_date(date)
    end
  end

  defp render_project(milestone) do
    render_association(milestone.project_id, milestone.project, & &1.name)
  end

  defp render_space(milestone) do
    render_association(milestone.project_id, milestone.space, & &1.name)
  end

  defp render_creator(milestone) do
    render_association(milestone.creator_id, milestone.creator, & &1.full_name)
  end

  defp render_association(nil, _association, _formatter), do: "None"

  defp render_association(_id, association, formatter) do
    cond do
      not Ecto.assoc_loaded?(association) ->
        "Not loaded"

      is_nil(association) ->
        "None"

      true ->
        formatter.(association)
    end
  end

  defp render_date(d), do: Operately.Time.as_date(d) |> Date.to_iso8601()

  defp compact_empty_lines(text) do
    text |> String.replace(~r/\n{3,}/, "\n\n")
  end
end
