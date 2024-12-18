defmodule Operately.Demo.PoorMansMarkdown do

  #
  # Poor man's Markdown to ProseMirror conversion.
  #
  # As there is no markdown -> ProseMirror conversion library available in Elixir, we
  # are shipping a simple implementation here. This implementation is limited to
  # paragraphs, bullet points, numbered lists, and bold text.
  #

  def from_markdown(markdown) do
    markdown
    |> String.split("\n\n", trim: true)   # Split into blocks (paragraphs/lists)
    |> Enum.reduce([], &parse_block/2)    # Parse each block
    |> build_prosemirror_doc()            # Build the ProseMirror document
  end

  defp build_prosemirror_doc(content) do
    %{
      "type" => "doc",
      "content" => content
    }
  end

  defp parse_block(block, acc) do
    cond do
      String.starts_with?(block, "- ") ->
        acc ++ parse_bullet_list(block)
      String.starts_with?(block, "1. ") ->
        acc ++ parse_numbered_list(block)
      String.match?(block, ~r/^#+\s/) ->
        acc ++ parse_heading(block)
      true ->
        acc ++ parse_paragraph(block)
    end
  end

  defp parse_numbered_list(block) do
    items =
      block
      |> String.split("\n", trim: true)
      |> Enum.map(&parse_numbered_item/1)

    [
      %{
        "type" => "orderedList",
        "content" => items,
        "attrs" => %{"start" => 1}
      },
      %{"type" => "paragraph"}
    ]
  end

  defp parse_numbered_item(item) do
    cleaned_item = String.replace(item, ~r/^\d+\./, "")

    %{
      "type" => "listItem",
      "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => cleaned_item}]}]
    }
  end

  defp parse_bullet_list(block) do
    items =
      block
      |> String.split("\n", trim: true)
      |> Enum.map(&parse_bullet_item/1)

    [
      %{
        "type" => "bulletList",
        "content" => items
      },
      %{"type" => "paragraph"}
    ]
  end

  defp parse_bullet_item(item) do
    cleaned_item = String.trim_leading(item, "- ")

    %{
      "type" => "listItem",
      "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => cleaned_item}]}]
    }
  end

  defp parse_heading(heading) do
    [_fulltext, hashes, cleaned_heading] = Regex.run(~r/^(#+)\s(.+)/, heading)
    level = String.length(hashes)

    [
      %{
        "type" => "heading",
        "content" => [
          %{
            "type" => "text",
            "text" => cleaned_heading
          }
        ],
        "attrs" => %{
          "level" => level
        }
      }
    ]
  end

  defp parse_paragraph(block) do
    [
      %{
        "type" => "paragraph",
        "content" => parse_text(block)
      },
      %{"type" => "paragraph"}
    ]
  end

  defp parse_text(text) do
    # support for bold text e.g **text**
    regex = ~r/\*\*(.*?)\*\*/

    String.split(text, regex, include_captures: true, trim: true)
    |> Enum.map(&build_text_node/1)
  end

  defp build_text_node(text) do
    cond do
      String.starts_with?(text, "**") && String.ends_with?(text, "**") ->
        bold_text = String.trim(text, "**")
        %{
          "type" => "text",
          "text" => bold_text,
          "marks" => [%{"type" => "bold"}]
        }

      true ->
        %{
          "type" => "text",
          "text" => text
        }
    end
  end
end
