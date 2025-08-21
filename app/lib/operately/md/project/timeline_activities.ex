defmodule Operately.MD.Project.TimelineActivities do
  def render(project) do
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

  defp render_person(role, person) do
    if person do
      "#{role}: #{person.full_name} (#{person.title})"
    else
      "#{role}: Not Assigned"
    end
  end

  defp render_date(date) do
    date |> Operately.Time.as_date() |> Date.to_iso8601()
  end
end