defmodule Operately.RichContent.MarkdownTaskLists do
  @moduledoc "Parses Markdown list blocks containing checkboxes, including nested lists."

  @item ~r/^(\s*)([-*+]|\d+\.)\s+(?:\[([ xX])\]\s*)?(.*)$/

  def contains_tasks?(block), do: Regex.match?(~r/^\s*[-*+]\s+\[[ xX]\]/m, block)

  def parse(block, inline) do
    block |> String.split("\n", trim: true) |> parse_lines(inline)
  end

  defp parse_lines([], _inline), do: []

  defp parse_lines([line | _] = lines, inline) do
    case item(line) do
      nil ->
        {paragraph, rest} = Enum.split_while(lines, &(item(&1) == nil))
        [%{"type" => "paragraph", "content" => inline.(Enum.join(paragraph, "\n"))} | parse_lines(rest, inline)]

      first ->
        {items, rest} = list_items(lines, first.indent, first.type, inline)
        list = %{"type" => first.type, "content" => items}
        list = if first.type == "orderedList", do: Map.put(list, "attrs", %{"start" => first.start}), else: list
        [list | parse_lines(rest, inline)]
    end
  end

  defp list_items([], _indent, _type, _inline), do: {[], []}

  defp list_items([line | rest] = lines, indent, type, inline) do
    case item(line) do
      %{indent: ^indent, type: ^type} = entry ->
        {children, remaining} = Enum.split_while(rest, &(indentation(&1) > indent))
        paragraph = %{"type" => "paragraph", "content" => inline.(entry.text)}
        node = %{"type" => if(type == "taskList", do: "taskItem", else: "listItem"), "content" => [paragraph | parse_lines(children, inline)]}
        node = if type == "taskList", do: Map.put(node, "attrs", %{"checked" => entry.checked}), else: node
        {siblings, remaining} = list_items(remaining, indent, type, inline)
        {[node | siblings], remaining}

      _ ->
        {[], lines}
    end
  end

  defp item(line) do
    case Regex.run(@item, line) do
      [_, whitespace, marker, checked, text] ->
        type =
          cond do
            checked != "" -> "taskList"
            marker in ["-", "*", "+"] -> "bulletList"
            true -> "orderedList"
          end

        %{
          indent: String.length(whitespace),
          type: type,
          checked: checked in ["x", "X"],
          text: text,
          start: if(type == "orderedList", do: String.to_integer(String.trim_trailing(marker, ".")), else: 1)
        }

      _ ->
        nil
    end
  end

  defp indentation(line), do: String.length(line) - String.length(String.trim_leading(line))
end
