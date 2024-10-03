defmodule Operately.Activities.Encoder do
  @moduledoc """
  This module is responsible for encoding content for activities. It uses
  Jason to encode content, but falls back to a recursive encoding function
  if Jason fails to encode the content.

  Jason will fail to encode content if it contains an Ecto.Association.NotLoaded
  struct, which is a struct that represents an association that has not been loaded
  from the database. This is a common issue when encoding content for activities,
  as the content may contain associations that are not loaded.
  """

  def encode(content) do
    content = content |> remove_not_loaded()

    case Jason.encode(content) do
      {:ok, encoded} -> Jason.decode!(encoded, keys: :atoms)
      {:error, _} -> encode(content)
    end
  end

  defp remove_not_loaded(map) when is_struct(map) do
    map |> Map.from_struct() |> remove_not_loaded()
  end

  defp remove_not_loaded(map) when is_map(map) do
    map
    |> Enum.reduce(%{}, fn {key, value}, acc ->
      case value do
        %Ecto.Association.NotLoaded{} -> acc
        _ -> Map.put(acc, key, clean_value(value))
      end
    end)
  end

  defp clean_value(map) when is_map(map), do: remove_not_loaded(map)
  defp clean_value(list) when is_list(list), do: Enum.map(list, &clean_value/1)
  defp clean_value(other), do: other
end
