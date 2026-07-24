defmodule Operately.Search.Text do
  @moduledoc """
  Normalizes user-visible text consistently when indexing and querying search titles.
  """

  def normalize_title(title) when is_binary(title) do
    title
    |> String.normalize(:nfkd)
    |> String.replace(~r/\p{M}/u, "")
    |> String.downcase()
    |> String.replace(~r/\s+/u, " ")
    |> String.trim()
  end

  def normalize_title(_), do: ""

  def normalize_query(query) when is_binary(query) do
    query
    |> String.replace(~r/\s+/u, " ")
    |> String.trim()
  end

  def normalize_query(_), do: ""
end
