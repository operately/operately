defmodule Operately.MD.Milestone do
  use Gettext, backend: OperatelyWeb.Gettext
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
    #{gettext("Status")}: #{milestone.status}
    #{gettext("Phase")}: #{milestone.phase}
    #{gettext("Project")}: #{render_project(milestone)}
    #{gettext("Space")}: #{render_space(milestone)}
    #{gettext("Creator")}: #{render_creator(milestone)}
    #{gettext("Created")}: #{render_date(milestone.inserted_at)}
    #{gettext("Last Updated")}: #{render_date(milestone.updated_at)}
    #{gettext("Due")}: #{render_due_date(milestone)}
    """
    |> then(fn info ->
      if milestone.completed_at do
        info <> "#{gettext("Completed At")}: #{render_date(milestone.completed_at)}"
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
      ## #{gettext("Description")}

      _#{gettext("No description provided.")}_
      """
    else
      """
      ## #{gettext("Description")}

      #{description}
      """
    end
  end

  defp render_tasks([]) do
    """
    ## #{gettext("Tasks")}

    _#{gettext("No tasks yet.")}_
    """
  end

  defp render_tasks(tasks) do
    """
    ## #{gettext("Tasks")}

    #{tasks |> Enum.sort_by(&(&1.inserted_at || ~N[0001-01-01 00:00:00])) |> Enum.map_join("\n", &render_task_line/1)}
    """
  end

  defp render_task_line(task) do
    status = (task.task_status && (task.task_status.label || task.task_status.value)) || gettext("Not set")

    "- #{task.name} | #{gettext("Status")}: #{status} | #{gettext("Assigned to")}: #{render_task_assignees(task.assigned_people)} | #{gettext("Due")}: #{render_task_due_date(task.due_date)}"
  end

  defp render_task_assignees(people) when is_list(people) and length(people) > 0 do
    people |> Enum.map(& &1.full_name) |> Enum.join(", ")
  end

  defp render_task_assignees(people) when is_list(people), do: gettext("Unassigned")

  defp render_task_due_date(nil), do: gettext("Not set")
  defp render_task_due_date(%Operately.ContextualDates.ContextualDate{date: date}), do: render_date(date)

  defp render_due_date(milestone) do
    case Operately.ContextualDates.Timeframe.end_date(milestone.timeframe) do
      nil -> gettext("Not set")
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

  defp render_association(nil, _association, _formatter), do: gettext("None")

  defp render_association(_id, association, formatter) do
    if is_nil(association), do: gettext("None"), else: formatter.(association)
  end

  defp render_date(d), do: Operately.Time.as_date(d) |> Date.to_iso8601()

  defp compact_empty_lines(text) do
    text |> String.replace(~r/\n{3,}/, "\n\n")
  end
end
