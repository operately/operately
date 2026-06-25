defmodule Operately.MD.Project do
  def render(project) do
    project =
      Operately.Repo.preload(project, [
        :group,
        :creator,
        :goal,
        :retrospective,
        :milestones,
        [check_ins: [:author]],
        [contributors: [:person]],
        [tasks: [:assigned_people, :milestone]]
      ])

    check_ins_with_comments = load_check_ins_with_comments(project.check_ins)
    discussions = Operately.Projects.Project.list_discussions(project.id)

    """
    # #{project.name}

    #{render_overview_info(project)}
    #{render_description(project)}
    #{render_people(project)}
    #{Operately.MD.Project.Timeframe.render(project)}
    #{render_milestones(project.milestones, project.tasks)}
    #{render_check_ins(check_ins_with_comments)}
    #{render_discussions(discussions)}
    #{render_retrospective(project.retrospective)}
    """
    |> compact_empty_lines()
  end

  defp render_overview_info(project) do
    [
      "Status: #{Operately.Projects.Project.status(project)}",
      render_progress_line(project),
      render_space_line(project),
      "Created: #{render_date(project.inserted_at)}",
      "Last Updated: #{render_date(project.updated_at)}",
      render_closed_at_line(project),
      render_archived_at_line(project),
      render_parent_goal_line(project)
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.join("\n")
    |> then(fn info -> info <> "\n\n" end)
  end

  defp render_description(project) do
    if project.description do
      """
      ## Description

      #{Operately.MD.RichText.render(project.description)}
      """
    else
      ""
    end
  end

  defp render_date(d) do
    Operately.Time.as_date(d) |> Date.to_iso8601()
  end

  defp render_milestones(milestones, _tasks) when not is_list(milestones), do: ""

  defp render_milestones([], tasks) do
    base = """
    ## Milestones

    _No milestones defined._
    """

    case render_unassigned_tasks_section(tasks) do
      nil -> base
      unassigned -> base <> "\n\n" <> unassigned
    end
  end

  defp render_milestones(milestones, tasks) do
    grouped_tasks = group_tasks_by_milestone(tasks)
    tasks_loaded? = is_list(tasks)

    milestone_sections =
      milestones
      |> Enum.sort_by(& &1.inserted_at)
      |> Enum.map(&render_milestone_entry(&1, Map.get(grouped_tasks, &1.id, []), tasks_loaded?))

    sections =
      case render_unassigned_tasks_section(if(tasks_loaded?, do: Map.get(grouped_tasks, nil, []), else: nil)) do
        nil -> milestone_sections
        unassigned -> milestone_sections ++ [unassigned]
      end

    """
    ## Milestones

    #{Enum.join(sections, "\n\n")}
    """
  end

  defp render_milestone_due(milestone) do
    case Operately.ContextualDates.Timeframe.end_date(milestone.timeframe) do
      nil -> "Not Set"
      date -> render_date(date)
    end
  end

  defp render_milestone_entry(milestone, tasks, tasks_loaded?) do
    [
      "  - #{milestone.title} (Status: #{milestone.status})",
      "",
      "    Due: #{render_milestone_due(milestone)}",
      render_milestone_completion_line(milestone),
      render_milestone_tasks_block(tasks, tasks_loaded?)
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.join("\n")
  end

  defp render_milestone_completion_line(milestone) do
    if milestone.status == :done && milestone.completed_at do
      "    Completed: #{render_date(milestone.completed_at)}"
    else
      nil
    end
  end

  defp render_milestone_tasks_block(_tasks, false), do: nil
  defp render_milestone_tasks_block(nil, true), do: nil
  defp render_milestone_tasks_block([], true), do: nil

  defp render_milestone_tasks_block(tasks, true) do
    [
      "",
      "    Tasks:",
      render_task_lines(tasks, "      ")
    ]
    |> Enum.join("\n")
  end

  defp render_unassigned_tasks_section(tasks) when not is_list(tasks), do: nil
  defp render_unassigned_tasks_section([]), do: nil

  defp render_unassigned_tasks_section(tasks) do
    """
    ### Tasks Without Milestone

    #{render_task_lines(tasks)}
    """
  end

  defp render_task_lines(tasks, indent \\ "") do
    tasks
    |> Enum.map_join("\n", fn task -> indent <> render_task_line(task) end)
  end

  defp render_task_line(task) do
    [
      "- #{task.name}",
      render_task_assignees_part(task.assigned_people),
      "Due: #{render_task_due_date(task.due_date)}"
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.join(" | ")
  end

  defp render_task_assignees_part(people) when is_list(people) and length(people) > 0, do: "Assigned to: #{Enum.map(people, & &1.full_name) |> Enum.join(", ")}"
  defp render_task_assignees_part(people) when is_list(people), do: "Assigned to: Unassigned"
  defp render_task_assignees_part(_), do: nil

  defp render_task_due_date(nil), do: "Not set"

  defp render_task_due_date(%Operately.ContextualDates.ContextualDate{date: date}) do
    render_date(date)
  end

  defp render_check_ins(check_ins) when not is_list(check_ins), do: ""

  defp render_check_ins([]) do
    """
    ## Check-ins

    _No check-ins yet._
    """
  end

  defp render_check_ins(check_ins) do
    """
    ## Check-ins

    #{Enum.map_join(check_ins, "\n\n", &render_check_in/1)}
    """
  end

  defp render_check_in(check_in) do
    [
      "### Check-in on #{render_date(check_in.inserted_at)}",
      render_check_in_author_line(check_in.author),
      Operately.MD.RichText.render(check_in.description),
      render_check_in_comments(check_in.comments || [])
    ]
    |> Enum.reject(&blank?/1)
    |> Enum.join("\n\n")
  end

  defp render_check_in_comments([]) do
    ""
  end

  defp render_check_in_comments(comments) do
    """
    #### Comments

    #{Enum.map_join(comments, "\n\n", &render_check_in_comment/1)}
    """
  end

  defp render_check_in_comment(comment) do
    """
    **#{comment.author.full_name}** on #{render_date(comment.inserted_at)}:

    #{Operately.MD.RichText.render(comment.content)}
    """
  end

  defp render_retrospective(retrospective) do
    cond do
      not Ecto.assoc_loaded?(retrospective) ->
        ""

      retrospective ->
        """
        ## Retrospective

        #{Operately.MD.RichText.render(retrospective.content)}
        """

      true ->
        ""
    end
  end

  defp render_people(project) do
    case render_contributors(project.contributors) do
      nil ->
        ""

      contributors ->
        """
        ## Contributors

        #{contributors}
        """
    end
  end

  defp compact_empty_lines(text) do
    text |> String.replace(~r/\n{3,}/, "\n\n")
  end

  defp render_discussions(discussions) when is_list(discussions) do
    if Enum.empty?(discussions) do
      """
      ## Discussions

      _No discussions yet._
      """
    else
      """
      ## Discussions

      #{Enum.map_join(discussions, "\n\n", &render_discussion/1)}
      """
    end
  end

  defp render_discussion(discussion) do
    """
    ### #{discussion.title}

    Author: #{discussion.author.full_name}
    Posted on: #{render_date(discussion.inserted_at)}

    #{Operately.MD.RichText.render(discussion.message)}
    """
  end

  defp load_check_ins_with_comments(check_ins) when is_list(check_ins) do
    Enum.map(check_ins, fn check_in ->
      comments = load_comments_for_check_in(check_in.id)
      Map.put(check_in, :comments, comments)
    end)
  end

  defp load_check_ins_with_comments(check_ins), do: check_ins

  defp load_comments_for_check_in(check_in_id) do
    import Ecto.Query

    from(c in Operately.Updates.Comment,
      where: c.entity_id == ^check_in_id and c.entity_type == :project_check_in,
      order_by: [asc: c.inserted_at],
      preload: [:author]
    )
    |> Operately.Repo.all()
  end

  defp render_progress(project = %{milestones: milestones}) when is_list(milestones), do: "#{Operately.Projects.Project.progress_percentage(project)}%"
  defp render_progress(_project), do: nil

  defp render_progress_line(project) do
    case render_progress(project) do
      nil -> nil
      progress -> "Progress: #{progress}"
    end
  end

  defp render_space(project), do: render_loaded_association(project.group, & &1.name)

  defp render_space_line(project) do
    case render_space(project) do
      nil -> nil
      space -> "Space: #{space}"
    end
  end

  defp render_parent_goal(%{goal_id: nil}), do: "None (Company-wide project)"
  defp render_parent_goal(project), do: render_loaded_association(project.goal, & &1.name)

  defp render_parent_goal_line(project) do
    case render_parent_goal(project) do
      nil -> nil
      goal -> "Parent Goal: #{goal}"
    end
  end

  defp render_closed_at_line(%{closed_at: nil}), do: nil
  defp render_closed_at_line(project), do: "Closed At: #{render_date(project.closed_at)}"

  defp render_archived_at_line(%{deleted_at: nil}), do: nil
  defp render_archived_at_line(project), do: "Archived At: #{render_date(project.deleted_at)}"

  defp render_contributors(contributors) when not is_list(contributors), do: nil
  defp render_contributors([]), do: "_No contributors listed._"

  defp render_contributors(contributors) do
    contributors
    |> Enum.map(&render_contributor_line/1)
    |> Enum.reject(&is_nil/1)
    |> case do
      [] -> nil
      lines -> Enum.join(lines, "\n")
    end
  end

  defp render_contributor_line(%{person: person, role: role}) do
    case render_loaded_association(person, fn person -> "#{person.full_name} (#{person.title})" end) do
      nil -> nil
      value -> "#{role}: #{value}"
    end
  end

  defp render_check_in_author_line(author) do
    case render_loaded_association(author, & &1.full_name) do
      nil -> nil
      author -> "Author: #{author}"
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

  defp group_tasks_by_milestone(tasks) when is_list(tasks) do
    tasks
    |> Enum.sort_by(&(&1.inserted_at || ~N[0001-01-01 00:00:00]))
    |> Enum.group_by(& &1.milestone_id)
  end

  defp group_tasks_by_milestone(_tasks), do: %{}

  defp blank?(value), do: value in [nil, ""]
end
