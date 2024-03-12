defmodule ProsemirrorMentions do
  def extract_ids(document) do
    extract_mentions_from_node(document) |> Enum.uniq()
  end

  def extract_mentions_from_node(%{"type" => "mention", "attrs" => %{"id" => id}}) do
    [id]
  end

  def extract_mentions_from_node(%{"content" => content}) do
    content |> Enum.flat_map(fn node -> extract_mentions_from_node(node) end)
  end

  def extract_mentions_from_node(_), do: []
end
