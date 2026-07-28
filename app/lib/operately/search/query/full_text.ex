defmodule Operately.Search.Query.FullText do
  @moduledoc """
  Builds the shared PostgreSQL text-search expression used by search queries.

  The stored vector remains the indexed prefilter. Phrase queries receive one
  additional boundary-aware check so adjacent title and body terms cannot form
  a phrase that does not exist in either field.
  """

  import Ecto.Query

  alias Operately.Search.Text

  @boundary_lexeme "operately search field boundary"

  defstruct [
    :normalized_title,
    :title_prefix,
    :use_prefix?,
    :tsquery_expr,
    :websearch_expr,
    :quoted_phrase?,
    :title_prefix?
  ]

  def build(query) do
    normalized_query = Text.normalize_query(query)
    normalized_title = Text.normalize_title(normalized_query)
    {use_prefix?, tsquery_expr, websearch_expr} = tsquery_args(normalized_query)

    %__MODULE__{
      normalized_title: normalized_title,
      title_prefix: title_prefix_pattern(normalized_title),
      use_prefix?: use_prefix?,
      tsquery_expr: tsquery_expr,
      websearch_expr: websearch_expr,
      quoted_phrase?: Text.quoted_phrase?(normalized_query),
      title_prefix?: Text.title_prefix_search?(normalized_query)
    }
  end

  def match_dynamic(%__MODULE__{} = query) do
    indexed_match = indexed_match_dynamic(query)
    text_match = phrase_boundary_match_dynamic(indexed_match, query)

    if query.title_prefix? do
      dynamic(
        [entry: entry],
        ^text_match or fragment("? LIKE ? ESCAPE '!'", entry.normalized_title, ^query.title_prefix)
      )
    else
      text_match
    end
  end

  defp indexed_match_dynamic(query) do
    dynamic(
      [entry: entry],
      fragment(
        "? @@ (CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
        field(entry, :search_vector),
        ^query.use_prefix?,
        ^query.tsquery_expr,
        ^query.websearch_expr
      )
    )
  end

  defp phrase_boundary_match_dynamic(indexed_match, %{quoted_phrase?: false}), do: indexed_match

  defp phrase_boundary_match_dynamic(indexed_match, query) do
    dynamic(
      [entry: entry],
      ^indexed_match and
        fragment(
          "ts_delete(to_tsvector('public.operately'::regconfig, coalesce(?, '')) || $$'operately search field boundary':1$$::tsvector || to_tsvector('public.operately'::regconfig, coalesce(?, '')), ?) @@ (CASE WHEN ? THEN to_tsquery('public.operately'::regconfig, ?) ELSE websearch_to_tsquery('public.operately'::regconfig, ?) END)",
          entry.title,
          entry.body,
          ^@boundary_lexeme,
          ^query.use_prefix?,
          ^query.tsquery_expr,
          ^query.websearch_expr
        )
    )
  end

  defp tsquery_args(query) do
    case Text.search_tsquery(query) do
      {:prefix, tsquery} -> {true, tsquery, query}
      {:websearch, websearch_query} -> {false, "", websearch_query}
    end
  end

  defp title_prefix_pattern(title) do
    title
    |> String.replace("!", "!!")
    |> String.replace("%", "!%")
    |> String.replace("_", "!_")
    |> Kernel.<>("%")
  end
end
