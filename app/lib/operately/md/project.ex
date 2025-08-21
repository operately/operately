defmodule Operately.MD.Project do
  def render(project) do
    project =
      Operately.Repo.preload(project, [
        :group,
        :creator,
        :retrospective,
        :milestones,
        [check_ins: [:author, [comments: [:author]]]],
        [contributors: [:person]]
      ])

    discussions = Operately.Projects.Project.list_discussions(project.id)

    """
    # #{project.name}

    #{render_overview_info(project)}

    #{render_description(project)}
    #{render_people(project)}
    #{render_timeframe(project)}
    #{render_milestones(project.milestones)}
    #{render_check_ins(project.check_ins)}
    #{render_discussions(discussions)}
    #{render_timeline_activities(project)}
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
        Due: #{render_milestone_due(milestone)}#{render_milestone_completion(milestone)}
      """ end)}
    """
  end

  defp render_milestone_due(milestone) do
    case Operately.ContextualDates.Timeframe.end_date(milestone.timeframe) do
      nil -> "Not Set"
      date -> render_date(date)
    end
  end

  defp render_milestone_completion(milestone) do
    case milestone.completed_at do
      nil -> ""
      completed_at -> "\n        Completed: #{render_date(completed_at)}"
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

    #{render_check_in_comments(check_in.comments)}
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
    **#{comment.author.full_name}** on #{render_date(comment.inserted_at)}

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

  defp render_timeline_activities(project) do
    timeline_activities = 
      Operately.Activities.list_activities("project", project.id, ["project_timeline_edited"])
      |> Operately.Repo.preload([:author])
    
    if Enum.empty?(timeline_activities) do
      ""
    else
      """
      ## Timeline Editing Activities

      #{Enum.map_join(timeline_activities, "\n\n", &render_timeline_activity/1)}
      """
    end
  end

  defp render_timeline_activity(activity) do
    """
    ### Timeline edited on #{render_date(activity.inserted_at)}

    #{render_person("Edited by", activity.author)}

    #{render_timeline_changes(activity.content)}
    """
  end

  defp render_timeline_changes(content) do
    changes = []
    
    # Add date changes if they exist
    changes = if content.old_start_date != content.new_start_date do
      changes ++ ["Start date changed from #{render_content_date(content.old_start_date)} to #{render_content_date(content.new_start_date)}"]
    else
      changes
    end
    
    changes = if content.old_end_date != content.new_end_date do
      changes ++ ["End date changed from #{render_content_date(content.old_end_date)} to #{render_content_date(content.new_end_date)}"]
    else
      changes
    end
    
    # Add milestone updates
    milestone_updates = content.milestone_updates || []
    changes = if length(milestone_updates) > 0 do
      milestone_changes = Enum.map(milestone_updates, fn update ->
        case {update.old_title, update.new_title, update.old_due_date, update.new_due_date} do
          {old_title, new_title, old_date, new_date} when old_title != new_title and old_date != new_date ->
            "Milestone \"#{old_title}\" renamed to \"#{new_title}\" and due date changed from #{render_content_date(old_date)} to #{render_content_date(new_date)}"
          {old_title, new_title, _, _} when old_title != new_title ->
            "Milestone \"#{old_title}\" renamed to \"#{new_title}\""
          {title, title, old_date, new_date} when old_date != new_date ->
            "Milestone \"#{title}\" due date changed from #{render_content_date(old_date)} to #{render_content_date(new_date)}"
          {title, title, _, _} ->
            "Milestone \"#{title}\" updated"
        end
      end)
      changes ++ milestone_changes
    else
      changes
    end
    
    # Add new milestones
    new_milestones = content.new_milestones || []
    changes = if length(new_milestones) > 0 do
      new_milestone_changes = Enum.map(new_milestones, fn milestone ->
        "New milestone \"#{milestone.title}\" added with due date #{render_content_date(milestone.due_date)}"
      end)
      changes ++ new_milestone_changes  
    else
      changes
    end
    
    if Enum.empty?(changes) do
      "Timeline was updated"
    else
      Enum.join(changes, "\n- ")
      |> then(&("- " <> &1))
    end
  end

  defp render_content_date(nil), do: "Not Set"
  defp render_content_date(date) when is_binary(date) do
    case Date.from_iso8601(date) do
      {:ok, parsed_date} -> Date.to_iso8601(parsed_date)
      _ -> date
    end
  end
  defp render_content_date(date), do: Date.to_iso8601(date)

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
    Published on: #{render_date(discussion.inserted_at)}

    #{Operately.MD.RichText.render(discussion.message)}
    """
  end
end
