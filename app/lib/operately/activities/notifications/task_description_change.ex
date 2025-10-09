defmodule Operately.Activities.Notifications.TaskDescriptionChange do
  alias Operately.RichContent

  def dispatch(activity) do
    activity
    |> mentioned_people()
    |> Enum.reject(&(&1 == activity.author_id))
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end

  defp mentioned_people(activity) do
    activity.content
    |> Map.get("description")
    |> decode_description()
    |> case do
      nil -> []
      description -> RichContent.find_mentioned_ids(description, :decode_ids)
    end
    |> Enum.uniq()
    |> Enum.reject(&is_nil/1)
  end

  defp decode_description(nil), do: nil

  defp decode_description(description) when is_binary(description) do
    case Jason.decode(description) do
      {:ok, decoded} -> decoded
      _ -> nil
    end
  end

  defp decode_description(description) when is_map(description), do: description
  defp decode_description(_), do: nil
end
