defmodule Operately.MD.Task do
  use Gettext, backend: OperatelyWeb.Gettext
  def render(task) do
    task = Operately.Repo.preload(task, [:creator, :assigned_people, :project, :project_space, :space, :milestone])

    """
    # #{task.name}

    #{render_overview_info(task)}
    #{render_description(task)}
    #{render_people(task)}
    """
    |> compact_empty_lines()
  end

  defp render_overview_info(task) do
    [
      "#{gettext("Type")}: #{render_task_type(task)}",
      "#{gettext("Status")}: #{render_status(task)}",
      "#{gettext("Priority")}: #{render_optional(task.priority)}",
      "#{gettext("Size")}: #{render_optional(task.size)}",
      "#{gettext("Due")}: #{render_due_date(task.due_date)}",
      "#{gettext("Creator")}: #{render_creator(task)}",
      "#{gettext("Space")}: #{render_space(task)}"
    ]
    |> add_project_lines(task)
    |> Kernel.++([
      "#{gettext("Created")}: #{render_date(task.inserted_at)}",
      "#{gettext("Last Updated")}: #{render_date(task.updated_at)}"
    ])
    |> maybe_add_closed_at(task)
    |> Enum.join("\n")
    |> then(&(&1 <> "\n\n"))
  end

  defp render_description(task) do
    description = Operately.MD.RichText.render(task.description)

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

  defp render_people(task) do
    """
    ## #{gettext("People")}

    #{gettext("Assignees")}: #{render_assignees(task.assigned_people)}
    """
  end

  defp render_task_type(task) do
    case Operately.Tasks.Task.task_type(task) do
      "project" -> gettext("Project Task")
      "space" -> gettext("Space Task")
      _ -> gettext("Task")
    end
  end

  defp render_status(%{task_status: %{label: label}}) when is_binary(label), do: label
  defp render_status(%{task_status: %{value: value}}) when is_binary(value), do: value
  defp render_status(_), do: gettext("Not set")

  defp render_optional(nil), do: gettext("Not set")
  defp render_optional(value), do: value

  defp render_due_date(nil), do: gettext("Not set")
  defp render_due_date(%Operately.ContextualDates.ContextualDate{date: date}), do: render_date(date)

  defp render_creator(task) do
    render_association(task.creator_id, task.creator, & &1.full_name)
  end

  defp render_space(task) do
    case task_kind(task) do
      :space ->
        render_association(task.space_id, task.space, & &1.name)

      :project ->
        render_association(task.project_id, task.project_space, & &1.name)

      :unknown ->
        gettext("Unknown")
    end
  end

  defp add_project_lines(lines, task) do
    case task_kind(task) do
      :space ->
        lines

      :project ->
        lines ++
          [
            "#{gettext("Project")}: #{render_project(task)}",
            "#{gettext("Milestone")}: #{render_milestone(task)}"
          ]

      :unknown ->
        lines ++
          [
            "#{gettext("Project")}: #{render_project(task)}",
            "#{gettext("Milestone")}: #{render_milestone(task)}"
          ]
    end
  end

  defp maybe_add_closed_at(lines, %{closed_at: nil}), do: lines
  defp maybe_add_closed_at(lines, task), do: lines ++ ["#{gettext("Closed At")}: #{render_date(task.closed_at)}"]

  defp render_project(task) do
    case task_kind(task) do
      :project -> render_association(task.project_id, task.project, & &1.name)
      :unknown -> gettext("Unknown")
    end
  end

  defp render_milestone(task) do
    case task_kind(task) do
      :project -> render_association(task.milestone_id, task.milestone, & &1.title)
      :unknown -> gettext("Unknown")
    end
  end

  defp render_assignees(people) when is_list(people) and length(people) > 0 do
    people |> Enum.map(& &1.full_name) |> Enum.join(", ")
  end

  defp render_assignees(people) when is_list(people), do: gettext("Unassigned")

  defp task_kind(task) do
    case {task.project_id, task.space_id} do
      {project_id, nil} when not is_nil(project_id) -> :project
      {nil, space_id} when not is_nil(space_id) -> :space
      _ -> :unknown
    end
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
