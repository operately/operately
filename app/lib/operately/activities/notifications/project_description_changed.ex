defmodule Operately.Activities.Notifications.ProjectDescriptionChanged do
  @moduledoc """
  Notifies the following people:
  - People mentioned in the project description

  The author of the activity is excluded from notifications.
  """

  alias Operately.RichContent

  def dispatch(activity) do
    activity
    |> description()
    |> mentioned_people(activity)
    |> Enum.reject(&(&1 == activity.author_id))
    |> Enum.uniq()
    |> Enum.map(fn person_id ->
      %{
        person_id: person_id,
        activity_id: activity.id,
        should_send_email: true
      }
    end)
    |> Operately.Notifications.bulk_create()
  end

  defp mentioned_people(nil, _activity), do: []

  defp mentioned_people(description, _activity) do
    RichContent.find_mentioned_ids(description, :decode_ids)
  end

  defp description(activity) do
    activity.content["description"]
    |> decode_description()
    |> case do
      nil -> decode_description(get_in(activity.content, ["project", "description"]))
      value -> value
    end
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
