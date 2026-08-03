defmodule Operately.Search.CompanyQuery.ResultBuilder do
  @moduledoc """
  Converts ranked company-search candidates into shared search results.

  This module contains no database access. It selects the user-facing match field,
  cleans plain-text body excerpts for title and body matches, and builds type-safe
  navigation metadata.
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
  defp matched_field(%{source_type: :discussion}, true), do: :title
  defp matched_field(%{source_type: :milestone}, true), do: :title
  defp matched_field(%{source_type: source_type}, true) when source_type in [:project_check_in, :goal_check_in, :project_retrospective], do: :title
  defp matched_field(_candidate, true), do: :name
  defp matched_field(%{body_kind: "title"}, false), do: :title
  defp matched_field(%{body_kind: "content"}, false), do: :content
  defp matched_field(%{body_kind: "description"}, false), do: :description
  defp matched_field(%{body_kind: "message"}, false), do: :message

  # People only index a job title as "body"; keep name matches snippet-free.
  defp snippet(%{source_type: :person}, true), do: nil

  defp snippet(candidate, _title_match?) do
    case clean_snippet(candidate.body_snippet) do
      nil -> nil
      cleaned -> maybe_append_ellipsis(cleaned, Map.get(candidate, :body))
    end
  end

  defp clean_snippet(nil), do: nil

  defp clean_snippet(body_snippet) do
    cleaned =
      body_snippet
      |> String.replace(@snippet_start, "")
      |> String.replace(@snippet_stop, "")
      |> String.trim()

    if cleaned == "", do: nil, else: cleaned
  end

  defp maybe_append_ellipsis(snippet, body) when body in [nil, ""], do: snippet

  defp maybe_append_ellipsis(snippet, body) do
    if normalize_text(body) == normalize_text(snippet), do: snippet, else: snippet <> "..."
  end

  defp normalize_text(text) do
    text
    |> String.trim()
    |> String.replace(~r/\s+/u, " ")
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

  defp navigation_target(%{source_type: :project} = candidate), do: %{project_id: candidate.source_id}
  defp navigation_target(%{source_type: :goal} = candidate), do: %{goal_id: candidate.source_id}
  defp navigation_target(%{source_type: :milestone} = candidate), do: %{milestone_id: candidate.source_id}
  defp navigation_target(%{source_type: :task} = candidate), do: %{task_id: candidate.source_id}
  defp navigation_target(%{source_type: :person} = candidate), do: %{person_id: candidate.source_id}
  defp navigation_target(%{source_type: :discussion} = candidate), do: %{discussion_id: candidate.source_id}
  defp navigation_target(%{source_type: :project_check_in} = candidate), do: %{project_check_in_id: candidate.source_id}
  defp navigation_target(%{source_type: :goal_check_in} = candidate), do: %{goal_check_in_id: candidate.source_id}

  defp navigation_target(%{source_type: :project_retrospective} = candidate) do
    %{project_id: candidate.source_project_id, project_retrospective_id: candidate.source_id}
  end
end
