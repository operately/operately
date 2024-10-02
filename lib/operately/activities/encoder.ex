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

  defp remove_not_loaded(map) when is_map(map) do
    map 
    |> Map.from_struct() 
    |> Map.to_list()
    |> Enum.reject(fn {_, value} -> match?(%Ecto.Association.NotLoaded{}, value) end)
    |> Enum.map(fn {key, value} -> 
      if is_list(value) do
        {key, Enum.map(value, &remove_not_loaded/1)}
      else
        {key, value}
      end
    end)
    |> Enum.into(%{})
  end
end
