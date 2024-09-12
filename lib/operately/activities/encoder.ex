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
    content
    |> to_keyword_list()
    |> remove_not_loaded()
    |> encode_key_value_list()
    |> Enum.into(%{})
  end

  defp encode_key_value_list(key_value_list) do
    Enum.map(key_value_list, fn {key, value} -> 
      case try_jason_encode(value) do
        {:ok, _} -> {key, value}
        {:error, _} -> {key, encode(value)}
      end
    end)
  end

  defp try_jason_encode(value) do
    case Jason.encode(value) do
      {:ok, _} -> {:ok, value}
      {:error, _} -> encode(value)
    end
  rescue
    _ -> {:error, value}
  end

  defp to_keyword_list(map) do
    map |> Map.from_struct() |> Map.to_list()
  end

  defp remove_not_loaded(key_value_map) do
    Enum.reject(key_value_map, fn {_, value} -> match?(%Ecto.Association.NotLoaded{}, value) end)
  end
end
