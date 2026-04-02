defmodule Operately.Data.Change096MovePersonNotificationSettingsToPreferences do
  import Ecto.Query, only: [from: 1]

  alias Operately.Repo

  defmodule Person do
    use Operately.Schema

    schema "people" do
      field :preferences, :map
      field :notify_about_assignments, :boolean
      field :notify_on_mention, :boolean
      field :send_daily_summary, :boolean
    end
  end

  def run do
    Repo.transaction(fn ->
      Repo.stream(from p in Person)
      |> Enum.each(fn person ->
        person
        |> Ecto.Changeset.change(preferences: merge_preferences(person))
        |> Repo.update!()
      end)
    end)
  end

  def merge_preferences(person) do
    preferences = person.preferences || %{}
    notifications = preferences["notifications"] || preferences[:notifications] || %{}

    merged_notifications =
      notifications
      |> put_if_missing("notify_about_assignments", coalesce_preference(person.notify_about_assignments))
      |> put_if_missing("notify_on_mention", coalesce_preference(person.notify_on_mention))
      |> put_if_missing("send_daily_summary", coalesce_preference(person.send_daily_summary))

    Map.put(preferences, "notifications", merged_notifications)
  end

  defp put_if_missing(map, key, value) do
    case Map.has_key?(map, key) or Map.has_key?(map, String.to_atom(key)) do
      true -> map
      false -> Map.put(map, key, value)
    end
  end

  defp coalesce_preference(nil), do: true
  defp coalesce_preference(value), do: value
end
