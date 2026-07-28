defmodule Operately.Search.CompanyQuery.ResultBuilder do
  @moduledoc """
  Converts ranked company-search candidates into shared search results.

  This module contains no database access. It selects the user-facing match field,
  removes internal snippet markers, and builds type-safe navigation metadata.
  """

  alias Operately.Search.Result

  # PostgreSQL's `ts_headline` places these non-HTML markers around matched terms.
  # They are stripped for today's plain-text result and can later be parsed into
  # structured highlighted segments without rendering database-generated HTML.
  @snippet_start "__OPERATELY_SEARCH_START__"
  @snippet_stop "__OPERATELY_SEARCH_STOP__"

  def snippet_start, do: @snippet_start
  def snippet_stop, do: @snippet_stop

  def build(candidates), do: Enum.map(candidates, &build_one/1)

  def build_one(candidate) do
    title_match? = candidate.exact_title or candidate.prefix_title or candidate.title_match

    %Result{
      id: candidate.source_id,
      type: candidate.source_type,
      title: candidate.title,
      context: candidate.owner_name,
      matched_field: matched_field(candidate, title_match?),
      snippet: snippet(candidate, title_match?),
      state: candidate.state,
      navigation_target: navigation_target(candidate)
    }
  end

  defp matched_field(%{source_type: :resource_hub_document}, true), do: :title
  defp matched_field(_candidate, true), do: :name
  defp matched_field(%{body_kind: "content"}, false), do: :content
  defp matched_field(%{body_kind: "description"}, false), do: :description

  defp snippet(_candidate, true), do: nil

  defp snippet(candidate, false) do
    candidate.body_snippet
    |> String.replace(@snippet_start, "")
    |> String.replace(@snippet_stop, "")
    |> String.trim()
  end

  defp navigation_target(%{source_type: :resource_hub_folder} = candidate) do
    %{resource_hub_id: candidate.resource_hub_id, folder_id: candidate.source_id}
  end

  defp navigation_target(%{source_type: :resource_hub_document} = candidate) do
    %{resource_hub_id: candidate.resource_hub_id, document_id: candidate.source_id}
  end

  defp navigation_target(%{source_type: :resource_hub_file} = candidate) do
    %{resource_hub_id: candidate.resource_hub_id, file_id: candidate.source_id}
  end

  defp navigation_target(%{source_type: :resource_hub_link} = candidate) do
    %{resource_hub_id: candidate.resource_hub_id, link_id: candidate.source_id}
  end
end
