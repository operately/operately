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
        [contributors: [:person]]
      ])

    check_ins_with_comments = load_check_ins_with_comments(project.check_ins)
    discussions = Operately.Projects.Project.list_discussions(project.id)

    """
    # #{project.name}

    #{render_overview_info(project)}
    #{render_description(project)}
    #{render_people(project)}
    #{render_timeframe(project)}
    #{render_milestones(project.milestones)}
    #{render_check_ins(check_ins_with_comments)}
    #{render_discussions(discussions)}
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
        info <> "Parent Goal: #{project.goal.name}"
      else
        info <> "Parent Goal: None (Company-wide project)"
      end
    end)
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
    case Operately.ContextualDates.Timeframe.end_date(milestone.timeframe) do
      nil -> "Not Set"
      date -> render_date(date)
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

    #{render_check_in_comments(check_in.comments || [])}
    """
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

    #{Operately.MD.RichText.render(comment.content["message"])}
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

    #{render_person("Author", discussion.author)}
    Posted on: #{render_date(discussion.inserted_at)}

    #{Operately.MD.RichText.render(discussion.message)}
    """
  end

  defp load_check_ins_with_comments(check_ins) do
    Enum.map(check_ins, fn check_in ->
      comments = load_comments_for_check_in(check_in.id)
      Map.put(check_in, :comments, comments)
    end)
  end

  defp load_comments_for_check_in(check_in_id) do
    import Ecto.Query

    from(c in Operately.Updates.Comment,
      where: c.entity_id == ^check_in_id and c.entity_type == :project_check_in,
      order_by: [asc: c.inserted_at],
      preload: [:author]
    )
    |> Operately.Repo.all()
  end
end
