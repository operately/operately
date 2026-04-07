defmodule Operately.Data.Change097BackfillNotifyOnMentionFromEmailPreference do
  import Ecto.Query, only: [from: 1]

  alias Operately.Repo

  defmodule Person do
    use Operately.Schema

    schema "people" do
      field :preferences, :map
    end
  end

  def run do
    Repo.transaction(fn ->
      Repo.stream(from p in Person)
      |> Enum.each(fn person ->
        preferences = normalize_preferences(person.preferences || %{})

        if preferences != person.preferences do
          person
          |> Ecto.Changeset.change(preferences: preferences)
          |> Repo.update!()
        end
      end)
    end)
  end

  def normalize_preferences(preferences) do
    notifications = preference_get(preferences, "notifications") || %{}
    current_email_preference = preference_get(notifications, "email_preference")
    email_window_minutes = preference_get(notifications, "email_window_minutes")

    notify_on_mention =
      case current_email_preference do
        "mentions_only" -> true
        :mentions_only -> true
        _ -> false
      end

    notifications =
      notifications
      |> preference_put("email_preference", "buffered")
      |> preference_put("notify_on_mention", notify_on_mention)

    notifications =
      if email_window_minutes do
        preference_put(notifications, "email_window_minutes", email_window_minutes)
      else
        notifications
      end

    preferences
    |> Map.delete("notifications")
    |> Map.delete(:notifications)
    |> Map.put("notifications", notifications)
  end

  defp preference_get(map, key) when is_map(map) do
    case key do
      "notifications" -> Map.get(map, "notifications") || Map.get(map, :notifications)
      "email_preference" -> Map.get(map, "email_preference") || Map.get(map, :email_preference)
      "notify_on_mention" -> Map.get(map, "notify_on_mention") || Map.get(map, :notify_on_mention)
      "email_window_minutes" -> Map.get(map, "email_window_minutes") || Map.get(map, :email_window_minutes)
      _ -> Map.get(map, key)
    end
  end

  defp preference_get(_map, _key), do: nil

  defp preference_put(map, key, value) do
    case key do
      "email_preference" ->
        map
        |> Map.delete("email_preference")
        |> Map.delete(:email_preference)
        |> Map.put("email_preference", value)

      "notify_on_mention" ->
        map
        |> Map.delete("notify_on_mention")
        |> Map.delete(:notify_on_mention)
        |> Map.put("notify_on_mention", value)

      "email_window_minutes" ->
        map
        |> Map.delete("email_window_minutes")
        |> Map.delete(:email_window_minutes)
        |> Map.put("email_window_minutes", value)

      _ ->
        Map.put(map, key, value)
    end
  end
end
