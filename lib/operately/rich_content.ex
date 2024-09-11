defmodule Operately.RichContent do
  @moduledoc """
  RichContent are the content of a messages, comments, etc, where the
  text is formatted as a ProseMirror JSON document.
  """

  def lookup_mentioned_people(document) do
    document
    |> find_mentioned_ids()
    |> Enum.map(fn id -> find_persons_by_id(id) end)
    |> Enum.filter(fn person -> person != nil end)
  end

  def find_persons_by_id(id) do
    with {:ok, id} <- OperatelyWeb.Api.Helpers.decode_id(id) do
      Operately.People.get_person(id)
    else
      _ -> nil
    end
  end

  def find_mentioned_ids(document) do
    extract_mentions_from_node(document) |> Enum.uniq()
  end

  def find_mentioned_ids(document, :decode_ids) do
    {:ok, ids} =
      document
      |> find_mentioned_ids()
      |> Enum.uniq()
      |> OperatelyWeb.Api.Helpers.decode_id()

    ids
  end

  def extract_mentions_from_node(%{"type" => "mention", "attrs" => %{"id" => id}}) do
    [id]
  end

  def extract_mentions_from_node(%{"content" => content}) do
    content |> Enum.flat_map(fn node -> extract_mentions_from_node(node) end)
  end

  def extract_mentions_from_node(_), do: []
end
