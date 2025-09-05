defmodule Operately.Data.Change070UpdateProjectTimelineEditedActivity do
  import Ecto.Query, only: [from: 2]
  alias Operately.Repo
  alias Operately.Activities.Activity

  def run do
    Repo.transaction(fn ->
      from(a in Activity,
        where: a.action == "project_timeline_edited"
      )
      |> Repo.all()
      |> Enum.each(&update_activity/1)
    end)
  end

  defp update_activity(activity) do
    updated_content =
      activity.content
      |> update_milestone_updates()
      |> update_new_milestones()
      |> rename_milestone_updates_field()

    Repo.update_all(
      from(a in Activity, where: a.id == ^activity.id),
      set: [content: updated_content]
    )
  end

  defp update_milestone_updates(content) do
    case content["milestone_updates"] do
      nil -> content
      [] -> content
      milestone_updates when is_list(milestone_updates) ->
        updated_updates = Enum.map(milestone_updates, fn update ->
          update
          |> maybe_convert_field("old_due_date")
          |> maybe_convert_field("new_due_date")
        end)
        Map.put(content, "milestone_updates", updated_updates)
      _ -> content
    end
  end

  defp update_new_milestones(content) do
    case content["new_milestones"] do
      nil -> content
      [] -> content
      new_milestones when is_list(new_milestones) ->
        updated_milestones = Enum.map(new_milestones, fn milestone ->
          maybe_convert_field(milestone, "due_date")
        end)
        Map.put(content, "new_milestones", updated_milestones)
      _ -> content
    end
  end

  # Rename milestone_updates to updated_milestones for consistency with GraphQL schema
  defp rename_milestone_updates_field(content) do
    case content["milestone_updates"] do
      nil -> content
      milestone_updates ->
        content
        |> Map.put("updated_milestones", milestone_updates)
        |> Map.delete("milestone_updates")
    end
  end

  # Convert a UTC datetime field to a date if it's not nil
  defp maybe_convert_field(content, field_name) do
    case content[field_name] do
      nil -> content

      datetime_str when is_binary(datetime_str) ->
        case DateTime.from_iso8601(datetime_str) do
          {:ok, datetime, _offset} ->
            date_str = Date.to_iso8601(DateTime.to_date(datetime))
            Map.put(content, field_name, date_str)

          _ ->
            # If parsing fails, leave it unchanged
            content
        end
      _ -> content
    end
  end
end
