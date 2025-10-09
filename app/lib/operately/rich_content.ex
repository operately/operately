defmodule Operately.RichContent do
  @moduledoc """
  RichContent are the content of a messages, comments, etc, where the
  text is formatted as a ProseMirror JSON document.
  """

  def parse(document) do
    case Jason.decode(document) do
      {:ok, decoded} -> {:ok, decoded}
      {:error, _} -> {:error, "Invalid JSON"}
    end
  end

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

  def find_mentioned_ids(nil), do: []

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

  def empty?(rich_content) do
    case rich_content do
      nil -> false

      rich_content when rich_content == %{} -> false

      %{"type" => "doc", "content" => content} when is_list(content) ->
        # Convert TipTap content to string and check if it's meaningful
        content
        |> rich_content_to_string()
        |> String.trim()
        |> case do
          "" -> false
          _non_empty -> true
        end

      _ -> false
    end
  end

  @doc """
  Converts TipTap rich content to a plain string, similar to the JavaScript richContentToString function.
  """
  def rich_content_to_string(content) when is_list(content) do
    content
    |> Enum.map(&rich_content_to_string/1)
    |> Enum.join(" ")
  end

  def rich_content_to_string(%{"type" => "text", "text" => text}) when is_binary(text) do
    text
  end

  def rich_content_to_string(%{"type" => "mention", "attrs" => %{"label" => label}}) when is_binary(label) do
    label
  end

  def rich_content_to_string(%{"content" => content}) when is_list(content) do
    rich_content_to_string(content)
  end

  def rich_content_to_string(_), do: ""

  defmodule Builder do
    def doc(content) do
      %{type: "doc", content: content} |> Jason.encode!() |> Jason.decode!()
    end

    def paragraph(content) do
      %{type: "paragraph", content: content}
    end

    def text(text, marks \\ []) do
      %{type: "text", text: text, marks: marks}
    end

    def bold(text), do: %{type: "text", text: text, marks: [%{type: "bold"}]}
    def italic(text), do: %{type: "text", text: text, marks: [%{type: "italic"}]}
    def code(text), do: %{type: "text", text: text, marks: [%{type: "code"}]}

    def bg_gray(text), do: %{type: "text", text: text, marks: [%{type: "highlight", attrs: %{"highlight" => "bgGray"}}]}
    def bg_green(text), do: %{type: "text", text: text, marks: [%{type: "highlight", attrs: %{"highlight" => "bgGreen"}}]}
    def bg_yellow(text), do: %{type: "text", text: text, marks: [%{type: "highlight", attrs: %{"highlight" => "bgYellow"}}]}
    def bg_red(text), do: %{type: "text", text: text, marks: [%{type: "highlight", attrs: %{"highlight" => "bgRed"}}]}
  end
end
