defmodule OperatelyEmail.RichTextExcerpt do
  @default_limit 120
  @default_suffix "..."

  def excerpt(content, opts \\ []) do
    limit = Keyword.get(opts, :limit, @default_limit)
    suffix = Keyword.get(opts, :suffix, @default_suffix)

    case shorten_content(content, limit, suffix: suffix) do
      nil ->
        %{html: nil, text: nil}

      shortened ->
        html =
          shortened
          |> OperatelyEmail.Templates.rich_text()
          |> Phoenix.HTML.safe_to_string()
          |> blank_to_nil()

        text =
          shortened
          |> Operately.RichContent.rich_content_to_string()
          |> String.trim()
          |> blank_to_nil()

        %{html: html, text: text}
    end
  end

  def shorten_content(content, limit, opts \\ []) do
    suffix = Keyword.get(opts, :suffix, @default_suffix)
    limit = max(limit, 0)

    case parse_content(content) do
      %{} = parsed ->
        {shortened, _count} = shorten_node(parsed, 0, limit, suffix)
        shortened

      _ ->
        nil
    end
  end

  defp parse_content(nil), do: nil
  defp parse_content(content) when is_map(content), do: content

  defp parse_content(content) when is_binary(content) do
    case Jason.decode(content) do
      {:ok, decoded} when is_map(decoded) -> decoded
      _ -> nil
    end
  end

  defp parse_content(_), do: nil

  defp shorten_node(node, count, limit, suffix) when is_map(node) do
    {node, count} = maybe_shorten_text(node, count, limit, suffix)
    {node, count} = maybe_shorten_mention_label(node, count, limit, suffix)

    case fetch_value(node, "content") do
      children when is_list(children) ->
        {shortened_children, count} = shorten_children(children, count, limit, suffix, [])
        {put_value(node, "content", shortened_children), count}

      _ ->
        {node, count}
    end
  end

  defp shorten_node(node, count, _limit, _suffix), do: {node, count}

  defp shorten_children([], count, _limit, _suffix, acc), do: {Enum.reverse(acc), count}

  defp shorten_children([child | rest], count, limit, suffix, acc) do
    {shortened_child, count} = shorten_node(child, count, limit, suffix)
    acc = [shortened_child | acc]

    if count < limit do
      shorten_children(rest, count, limit, suffix, acc)
    else
      {Enum.reverse(acc), count}
    end
  end

  defp maybe_shorten_text(node, count, limit, suffix) do
    case fetch_value(node, "text") do
      text when is_binary(text) ->
        total = String.length(text) + count

        node =
          if total > limit do
            keep_chars = max(limit - count, 0)
            truncated = String.slice(text, 0, keep_chars)
            put_value(node, "text", append_suffix(truncated, suffix))
          else
            node
          end

        {node, total}

      _ ->
        {node, count}
    end
  end

  defp maybe_shorten_mention_label(node, count, limit, suffix) do
    case fetch_value(node, "attrs") do
      attrs when is_map(attrs) ->
        case fetch_value(attrs, "label") do
          label when is_binary(label) ->
            total = count + String.length(label)

            node =
              if total > limit do
                updated_attrs = put_value(attrs, "label", append_suffix(label, suffix))
                put_value(node, "attrs", updated_attrs)
              else
                node
              end

            {node, total}

          _ ->
            {node, count}
        end

      _ ->
        {node, count}
    end
  end

  defp append_suffix(value, suffix) when is_binary(suffix) and suffix != "", do: value <> suffix
  defp append_suffix(value, _suffix), do: value

  defp fetch_value(map, key) when is_map(map) do
    Map.get(map, key) ||
      Enum.find_value(map, fn
        {k, value} when is_atom(k) ->
          if Atom.to_string(k) == key, do: value, else: nil

        _ ->
          nil
      end)
  end

  defp put_value(map, key, value) when is_map(map) do
    cond do
      Map.has_key?(map, key) ->
        Map.put(map, key, value)

      true ->
        case Enum.find(map, fn
               {k, _} when is_atom(k) -> Atom.to_string(k) == key
               _ -> false
             end) do
          {atom_key, _} -> Map.put(map, atom_key, value)
          nil -> Map.put(map, key, value)
        end
    end
  end

  defp blank_to_nil(""), do: nil
  defp blank_to_nil(value), do: value
end
