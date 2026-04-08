defmodule Operately.Data.Change098SetPersonNotificationDefaults do
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
        preferences = set_notification_defaults(person.preferences || %{})

        if preferences != person.preferences do
          person
          |> Ecto.Changeset.change(preferences: preferences)
          |> Repo.update!()
        end
      end)
    end)
  end

  def set_notification_defaults(preferences) do
    notifications = preference_get(preferences, "notifications") || %{}

    notifications =
      notifications
      |> preference_put("notify_on_mention", true)

    preferences
    |> Map.delete("notifications")
    |> Map.delete(:notifications)
    |> Map.put("notifications", notifications)
  end

  defp preference_get(map, key) when is_map(map) do
    Map.get(map, key) || Map.get(map, String.to_atom(key))
  end

  defp preference_get(_map, _key), do: nil

  defp preference_put(map, key, value) do
    map
    |> Map.delete(key)
    |> Map.delete(String.to_atom(key))
    |> Map.put(key, value)
  end
end
