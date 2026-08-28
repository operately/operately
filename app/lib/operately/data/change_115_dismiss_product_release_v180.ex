defmodule Operately.Data.Change115DismissProductReleaseV180 do
  @moduledoc false

  import Ecto.Query, only: [from: 1]

  alias Operately.Repo

  # Matches the guid from the official marketing RSS feed for Operately v1.8.
  @release_id "https://operately.com/releases/v180"

  def release_id, do: @release_id

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
        preferences = dismiss_release(person.preferences || %{})

        if preferences != person.preferences do
          person
          |> Ecto.Changeset.change(preferences: preferences)
          |> Repo.update!()
        end
      end)
    end)
  end

  def dismiss_release(preferences) when is_map(preferences) do
    if dismissed_release_id(preferences) == @release_id do
      preferences
    else
      preferences
      |> Map.delete("dismissed_product_release_id")
      |> Map.delete(:dismissed_product_release_id)
      |> Map.put("dismissed_product_release_id", @release_id)
    end
  end

  def dismiss_release(_), do: %{"dismissed_product_release_id" => @release_id}

  defp dismissed_release_id(map) do
    Map.get(map, "dismissed_product_release_id") || Map.get(map, :dismissed_product_release_id)
  end
end
