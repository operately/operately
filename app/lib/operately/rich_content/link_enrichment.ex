defmodule Operately.RichContent.LinkEnrichment do
  @moduledoc """
  Enriches all rich-text documents in a response together. Generated labels carry
  reversible, response-only metadata; restore_source/1 removes it before writes.
  """

  alias Operately.RichContent.{ResourceLinks, ResourceLinkResolver}
  alias OperatelyWeb.Api.Helpers
  require Logger

  @metadata "operatelyResourceLink"

  def enrich(payload, %{person: person, company: company, origin: origin}) do
    source = restore_source(payload)

    {_, refs} =
      map_documents(source, [], fn document, refs ->
        {document, collect_refs(document, company.short_id, origin) ++ refs}
      end)

    case load_titles(refs, person, company) do
      titles when map_size(titles) == 0 ->
        source

      titles ->
        {result, _} =
          map_documents(source, nil, fn document, acc ->
            {map_nodes(document, &resolve_node(&1, titles, company.short_id, origin)), acc}
          end)

        result
    end
  end

  @doc """
  Restores original URL labels in nested rich-text documents and removes enrichment
  metadata, preserving client-edited labels and each field's JSON representation.
  """
  def restore_source(payload) do
    {source, _} = map_documents(payload, nil, fn document, acc -> {map_nodes(document, &restore_node/1), acc} end)
    source
  end

  defp load_titles(refs, person, company) do
    refs
    |> Enum.uniq()
    |> Enum.group_by(& &1.type)
    |> Enum.flat_map(fn {_type, refs} ->
      refs
      |> Enum.chunk_every(ResourceLinkResolver.max_unique_refs())
      |> Enum.flat_map(&ResourceLinkResolver.resolve(person, company, &1))
    end)
    |> Map.new(&{{&1.type, &1.id}, &1.title})
  rescue
    error in [DBConnection.ConnectionError] ->
      Logger.warning("Rich-text title lookup failed", error_type: inspect(error.__struct__))
      %{}
  end

  defp collect_refs(%{"type" => "text"} = node, company_id, origin) do
    case node_ref(node, company_id, origin) do
      nil -> []
      ref -> [ref]
    end
  end

  defp collect_refs(%{"content" => children}, company_id, origin) when is_list(children) do
    Enum.flat_map(children, &collect_refs(&1, company_id, origin))
  end

  defp collect_refs(_, _, _), do: []

  defp node_ref(%{"text" => text, "marks" => marks}, company_id, origin) when is_binary(text) and is_list(marks) do
    Enum.find_value(marks, fn
      %{"type" => "link", "attrs" => %{"href" => href}} when is_binary(href) ->
        with true <- ResourceLinks.url_label?(text, href),
             {:ok, ref} <- ResourceLinks.parse(href, origin),
             {:ok, ^company_id} <- Helpers.decode_company_id(ref.company_id),
             {:ok, id} <- decode_id(ref.id) do
          %{type: ref.type, id: id}
        else
          _ -> nil
        end

      _ ->
        nil
    end)
  end

  defp node_ref(_, _, _), do: nil

  defp decode_id(id) do
    Helpers.decode_id(id)
  rescue
    ArgumentError -> :error
  end

  defp resolve_node(%{"type" => "text"} = node, titles, company_id, origin) do
    with %{type: type, id: id} <- node_ref(node, company_id, origin),
         {:ok, title} <- Map.fetch(titles, {type, id}) do
      marks =
        Enum.map(node["marks"], fn
          %{"type" => "link", "attrs" => attrs} = mark when is_map(attrs) ->
            if ResourceLinks.url_label?(node["text"], attrs["href"]) do
              Map.put(mark, "attrs", Map.put(attrs, @metadata, %{"originalText" => node["text"], "resolvedText" => title}))
            else
              mark
            end

          mark ->
            mark
        end)

      %{node | "text" => title, "marks" => marks}
    else
      _ -> node
    end
  end

  defp resolve_node(node, _, _, _), do: node

  defp restore_node(%{"type" => "text", "text" => text, "marks" => marks} = node) when is_list(marks) do
    {marks, text} =
      Enum.map_reduce(marks, text, fn
        %{"type" => "link", "attrs" => attrs} = mark, text when is_map(attrs) ->
          original =
            case attrs[@metadata] do
              %{"originalText" => original, "resolvedText" => ^text} when is_binary(original) ->
                if ResourceLinks.url_label?(original, attrs["href"]), do: original, else: text

              _ ->
                text
            end

          {Map.put(mark, "attrs", Map.delete(attrs, @metadata)), original}

        mark, text ->
          {mark, text}
      end)

    %{node | "text" => text, "marks" => marks}
  end

  defp restore_node(node), do: node

  defp map_nodes(%{"content" => children} = node, fun) when is_list(children) do
    node |> Map.put("content", Enum.map(children, &map_nodes(&1, fun))) |> fun.()
  end

  defp map_nodes(node, fun), do: fun.(node)

  # Traverse response containers, but only transform nodes inside recognized documents.
  # Preserve untouched JSON strings byte-for-byte, including their whitespace.
  defp map_documents(%_{} = value, acc, _fun), do: {value, acc}

  defp map_documents(value, acc, fun) when is_map(value) do
    if Operately.RichContent.tiptap_document?(value) do
      fun.(value, acc)
    else
      {pairs, acc} =
        Enum.map_reduce(value, acc, fn {key, child}, acc ->
          {child, acc} = map_documents(child, acc, fun)
          {{key, child}, acc}
        end)

      {Map.new(pairs), acc}
    end
  end

  defp map_documents(value, acc, fun) when is_list(value), do: Enum.map_reduce(value, acc, &map_documents(&1, &2, fun))

  defp map_documents(value, acc, fun) when is_binary(value) do
    case String.trim_leading(value) do
      <<first, _::binary>> when first in [?{, ?[] ->
        case Jason.decode(value) do
          {:ok, decoded} ->
            {updated, acc} = map_documents(decoded, acc, fun)
            {if(updated == decoded, do: value, else: Jason.encode!(updated)), acc}

          _ ->
            {value, acc}
        end

      _ ->
        {value, acc}
    end
  end

  defp map_documents(value, acc, _fun), do: {value, acc}
end
