defmodule Operately.Search.Text do
  @moduledoc """
  Normalizes user-visible text consistently when indexing and querying search titles.
  """

  @websearch_or ~r/(?:^|\s)OR(?:\s|$)/
  @websearch_exclusion ~r/(?:^|\s)-/
  @token_splitter ~r/[^\p{L}\p{N}]+/u

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

  @doc """
  Builds the PostgreSQL tsquery used for resource-hub full-text matching.

  Ordinary typed input becomes a `to_tsquery` expression that requires every
  complete token and treats the last token as a prefix (`:*`). Quoted phrases,
  `OR`, and `-exclusions` stay on `websearch_to_tsquery` so their syntax is
  preserved without producing invalid `to_tsquery` input.
  """
  def search_tsquery(query) when is_binary(query) do
    normalized_query = normalize_query(query)

    cond do
      websearch_syntax?(normalized_query) ->
        {:websearch, normalized_query}

      prefix_tsquery = build_prefix_tsquery(normalized_query) ->
        {:prefix, prefix_tsquery}

      true ->
        {:websearch, normalized_query}
    end
  end

  def search_tsquery(_), do: {:websearch, ""}

  defp websearch_syntax?(query) do
    String.contains?(query, "\"") or Regex.match?(@websearch_or, query) or Regex.match?(@websearch_exclusion, query)
  end

  defp build_prefix_tsquery(query) do
    tokens =
      query
      |> normalize_title()
      |> String.split(@token_splitter, trim: true)

    case tokens do
      [] ->
        nil

      tokens ->
        {leading, [last]} = Enum.split(tokens, -1)

        (Enum.map(leading, &quote_lexeme/1) ++ [quote_lexeme(last) <> ":*"])
        |> Enum.join(" & ")
    end
  end

  defp quote_lexeme(lexeme) do
    "'" <> String.replace(lexeme, "'", "''") <> "'"
  end
end
