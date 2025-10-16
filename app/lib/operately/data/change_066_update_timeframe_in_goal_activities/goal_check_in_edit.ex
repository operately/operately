defmodule Operately.Data.Change066UpdateTimeframeInGoalActivities.GoalCheckInEdit do
  import Ecto.Query
  alias Operately.Repo
  alias Operately.Activities.Activity

  def run do
    goal_check_in_edit_activities =
      Repo.all(
        from a in Activity,
          where: a.action == "goal_check_in_edit",
          select: a
      )

    {success_count, error_count} =
      Enum.reduce(goal_check_in_edit_activities, {0, 0}, fn activity, {success, error} ->
        case update_activity_timeframes(activity) do
          {:ok, _} -> {success + 1, error}
          {:error, _} -> {success, error + 1}
        end
      end)

    {:ok, %{success_count: success_count, error_count: error_count}}
  end

  defp update_activity_timeframes(activity) do
    content = activity.content
    old_timeframe = Map.get(content, "old_timeframe")
    new_timeframe = Map.get(content, "new_timeframe")

    updated_content =
      content
      |> update_timeframe_with_contextual_dates(old_timeframe, "old_timeframe")
      |> update_timeframe_with_contextual_dates(new_timeframe, "new_timeframe")

    activity
    |> Activity.changeset(%{content: updated_content})
    |> Repo.update()
  end

  defp update_timeframe_with_contextual_dates(content, nil, _field_name), do: content

  defp update_timeframe_with_contextual_dates(content, timeframe, field_name) do
    start_date = get_date_from_timeframe(timeframe, "start_date")
    end_date = get_date_from_timeframe(timeframe, "end_date")

    # Skip if valid dates couldn't be extracted
    if is_nil(start_date) or is_nil(end_date) do
      content
    else
      contextual_start_date = %{
        "date_type" => "day",
        "value" => Calendar.strftime(start_date, "%b %d, %Y"),
        "date" => Date.to_iso8601(start_date)
      }

      contextual_end_date = %{
        "date_type" => "day",
        "value" => Calendar.strftime(end_date, "%b %d, %Y"),
        "date" => Date.to_iso8601(end_date)
      }

      updated_timeframe =
        Map.merge(timeframe, %{
          "contextual_start_date" => contextual_start_date,
          "contextual_end_date" => contextual_end_date
        })

      Map.put(content, field_name, updated_timeframe)
    end
  end

  defp get_date_from_timeframe(timeframe, field) when is_map(timeframe) do
    date_value =
      cond do
        Map.has_key?(timeframe, String.to_atom(field)) -> Map.get(timeframe, String.to_atom(field))
        Map.has_key?(timeframe, field) -> Map.get(timeframe, field)
        true -> nil
      end

    ensure_date(date_value)
  end

  defp get_date_from_timeframe(_timeframe, _field), do: nil

  defp ensure_date(%Date{} = date), do: date

  defp ensure_date(date) when is_binary(date) do
    case Date.from_iso8601(date) do
      {:ok, date_struct} -> date_struct
      _ -> nil
    end
  end

  defp ensure_date(_), do: nil
end
