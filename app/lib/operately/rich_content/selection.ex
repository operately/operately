defmodule Operately.RichContent.Selection do
  @moduledoc """
  Given editor JSON and a `{from, to}` range (end exclusive), `extract/2`
  returns the selected text as `quote`, plus up to 32 characters before it
  (`prefix`) and after it (`suffix`), wrapped in `{:ok, selection}`.

  Ranges follow ProseMirror's UTF-16 and document-structure positions.
  Extracted text uses newlines for block separators and hard breaks, and
  U+FFFC (object replacement character) for other non-text leaves.

  Returns `{:error, :invalid_selection}` for invalid or empty selections,
  unsupported nodes, or positions that split a UTF-16 surrogate pair.
  """
  @textblocks ~w(paragraph heading codeBlock)
  @containers ~w(bulletList orderedList listItem blockquote taskList taskItem table tableRow tableCell tableHeader)
  @leaves ~w(mention blob hardBreak horizontalRule)
  @context_length 32

  def extract(%{"type" => "doc", "content" => children}, {from, to})
      when is_list(children) and is_integer(from) and is_integer(to) and from >= 0 and from < to do
    with {:ok, chunks, size} <- walk_children(children, 0),
         tokens = List.flatten(chunks),
         true <- to <= size and valid_boundary?(tokens, from) and valid_boundary?(tokens, to),
         selected_text when selected_text != "" <- text_between(tokens, from, to) do
      {:ok,
       %{
         quote: selected_text,
         prefix: tokens |> text_between(0, from) |> String.slice(-@context_length, @context_length),
         suffix: tokens |> text_between(to, size) |> String.slice(0, @context_length)
       }}
    else
      _ -> {:error, :invalid_selection}
    end
  end

  def extract(_, _), do: {:error, :invalid_selection}

  defp walk(%{"type" => "text", "text" => text}, pos) when is_binary(text) do
    {tokens, finish} =
      text
      |> String.codepoints()
      |> Enum.map_reduce(pos, fn char, start ->
        size = byte_size(:unicode.characters_to_binary(char, :utf8, {:utf16, :big})) |> div(2)
        {%{from: start, to: start + size, text: char, kind: :text}, start + size}
      end)

    {:ok, tokens, finish}
  end

  defp walk(%{"type" => type}, pos) when type in @leaves do
    text = if type == "hardBreak", do: "\n", else: "\uFFFC"
    tokens = [%{from: pos, to: pos + 1, text: text, kind: :text}]
    tokens = if type == "horizontalRule", do: [block_marker(pos, pos + 1) | tokens], else: tokens
    {:ok, tokens, pos + 1}
  end

  defp walk(%{"type" => type} = node, pos) when type in @textblocks or type in @containers do
    children = Map.get(node, "content", [])

    with true <- is_list(children),
         {:ok, tokens, finish} <- walk_children(children, pos + 1) do
      tokens = if type in @textblocks, do: [block_marker(pos, finish + 1) | tokens], else: tokens
      {:ok, tokens, finish + 1}
    else
      _ -> :error
    end
  end

  defp walk(_, _), do: :error

  defp walk_children([], pos), do: {:ok, [], pos}

  defp walk_children([child | rest], pos) do
    with {:ok, tokens, next} <- walk(child, pos),
         {:ok, remaining, finish} <- walk_children(rest, next) do
      {:ok, [tokens | remaining], finish}
    end
  end

  defp block_marker(from, to), do: %{from: from, to: to, text: "", kind: :block}

  defp valid_boundary?(tokens, pos), do: not Enum.any?(tokens, &(&1.kind == :text and &1.from < pos and pos < &1.to))

  defp text_between(tokens, from, to) do
    tokens
    |> Enum.filter(&(&1.from < to and &1.to > from))
    |> Enum.map_reduce(false, fn
      %{kind: :block}, seen_block -> {if(seen_block, do: "\n", else: ""), true}
      %{text: text}, seen_block -> {text, seen_block}
    end)
    |> elem(0)
    |> Enum.join()
  end
end
