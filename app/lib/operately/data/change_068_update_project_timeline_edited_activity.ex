defmodule Operately.Data.Change068UpdateProjectTimelineEditedActivity do
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
      |> maybe_convert_field("old_start_date")
      |> maybe_convert_field("new_start_date")
      |> maybe_convert_field("old_end_date")
      |> maybe_convert_field("new_end_date")

    Repo.update_all(
      from(a in Activity, where: a.id == ^activity.id),
      set: [content: updated_content]
    )
  end

  # Convert a UTC datetime field to a date if it's not nil
  defp maybe_convert_field(content, field_name) do
    case content[field_name] do
      nil ->
        content

      datetime_str when is_binary(datetime_str) ->
        case DateTime.from_iso8601(datetime_str) do
          {:ok, datetime, _offset} ->
            date_str = Date.to_iso8601(DateTime.to_date(datetime))
            Map.put(content, field_name, date_str)

          _ ->
            # If parsing fails, leave it unchanged
            content
        end

      _ ->
        content
    end
  end
end
