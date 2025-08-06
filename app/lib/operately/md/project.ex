defmodule Operately.MD.Project do
  def render(project) do
    project =
      Operately.Repo.preload(project, [
        :group,
        :creator,
        :retrospective,
        :milestones,
        [check_ins: [:author]],
        [contributors: [:person]]
      ])

    """
    # #{project.name}

    #{render_overview_info(project)}

    #{render_description(project)}
    #{render_people(project)}
    #{render_timeframe(project)}
    #{render_milestones(project.milestones)}
    #{render_check_ins(project.check_ins)}
    #{render_retrospective(project.retrospective)}
    """
    |> compact_empty_lines()
  end

  defp render_overview_info(project) do
    """
    Status: #{Operately.Projects.Project.status(project)}
    Progress: #{Operately.Projects.Project.progress_percentage(project)}%
    Space: #{project.group.name}
    Created: #{render_date(project.inserted_at)}
    Last Updated: #{render_date(project.updated_at)}
    """
    |> then(fn info ->
      if project.closed_at do
        info <> "Closed At: #{render_date(project.closed_at)}"
      else
        info
      end
    end)
    |> then(fn info ->
      if project.deleted_at do
        info <> "Archived At: #{render_date(project.deleted_at)}"
      else
        info
      end
    end)
    |> then(fn info ->
      if project.goal do
        info <> "Goal: #{project.goal.name}"
      else
        info <> "Goal: None"
      end
    end)
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

  defp render_milestones([]) do
    """
    ## Milestones

    _No milestones defined._
    """
  end

  defp render_milestones(milestones) do
    """
    ## Milestones

    #{milestones |> Enum.sort_by(& &1.inserted_at) |> Enum.map_join("\n", fn milestone -> """
      - #{milestone.title} (Status: #{milestone.status})
        Due: #{render_milestone_due(milestone)}
      """ end)}
    """
  end

  defp render_milestone_due(milestone) do
    case milestone.timeframe do
      nil -> "Not Set"
      tf -> Operately.ContextualDates.Timeframe.end_date(tf) |> render_date()
    end
  end

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
    """
    ### Check-in on #{render_date(check_in.inserted_at)}

    #{render_person("Author", check_in.author)}

    #{Operately.MD.RichText.render(check_in.description)}
    """
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

  defp render_people(project) do
    """
    ## Contributors

    #{Enum.map(project.contributors, fn contributor -> render_person(contributor.role, contributor.person) end) |> Enum.join("\n")}
    """
  end

  defp render_person(role, person) do
    case person do
      %Ecto.Association.NotLoaded{} ->
        "#{role}: Not Loaded"

      nil ->
        "#{role}: Not Assigned"

      _ ->
        full_name = Map.get(person, :full_name, "Unknown")
        title = Map.get(person, :title, "Unknown")
        "#{role}: #{full_name} (#{title})"
    end
  end

  defp render_timeframe(project) do
    tf = project.timeframe

    """
    ## Timeframe

    Start Date: #{render_contextual_date(tf && tf.contextual_start_date)}
    Due Date: #{render_contextual_date(tf && tf.contextual_end_date)}
    """
  end

  defp render_contextual_date(nil), do: "Not Set"
  defp render_contextual_date(date), do: date.value

  defp compact_empty_lines(text) do
    text |> String.replace(~r/\n{3,}/, "\n\n")
  end
end
