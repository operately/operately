defmodule Operately.CuratedTemplates.RichText do
  @moduledoc "Validates portable template text without people, uploads, or resource references."
  @nodes ~w(doc paragraph text heading bulletList orderedList listItem blockquote codeBlock hardBreak horizontalRule table tableRow tableCell tableHeader)
  @marks ~w(bold italic strike underline code link highlight textStyle)
  @attrs ~w(level start language textAlign colspan rowspan colwidth href target rel class color backgroundColor)

  def valid?(%{"type" => "doc"} = doc), do: byte_size(Jason.encode!(doc)) <= 100_000 and node?(doc, 0)
  def valid?(_), do: false

  defp node?(%{"type" => type} = node, depth) when depth < 30 do
    type in @nodes and
      Enum.all?(Map.keys(node), &(&1 in ~w(type content text attrs marks))) and
      (not Map.has_key?(node, "text") or is_binary(node["text"])) and
      attrs?(Map.get(node, "attrs", %{})) and
      children?(Map.get(node, "content", []), depth + 1) and
      marks?(Map.get(node, "marks", []))
  end

  defp node?(_, _), do: false

  defp children?(children, depth) when is_list(children), do: Enum.all?(children, &node?(&1, depth))
  defp children?(_, _), do: false
  defp marks?(marks) when is_list(marks), do: Enum.all?(marks, &mark?/1)
  defp marks?(_), do: false
  defp mark?(%{"type" => type} = mark), do: type in @marks and Enum.all?(Map.keys(mark), &(&1 in ~w(type attrs))) and attrs?(Map.get(mark, "attrs", %{}))
  defp mark?(_), do: false

  defp attrs?(attrs) when is_map(attrs) do
    Enum.all?(attrs, fn {key, value} -> key in @attrs and attr?(key, value) end)
  end

  defp attrs?(_), do: false
  defp attr?("href", value) when is_binary(value), do: URI.parse(value).scheme in ["http", "https", "mailto"]
  defp attr?("href", _), do: false
  defp attr?(_, value), do: is_nil(value) or is_binary(value) or is_number(value) or (is_list(value) and Enum.all?(value, &is_number/1))
end
