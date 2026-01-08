defmodule Operately.Demo.PoorMansMarkdown do
  #
  # Poor man's Markdown to ProseMirror conversion.
  #
  # As there is no markdown -> ProseMirror conversion library available in Elixir, we
  # are shipping a simple implementation here. This implementation is limited to
  # headings, paragraphs, bullet points, numbered lists, bold text, and mentions.
  #

  def from_markdown(markdown, resources) do
    markdown
    |> String.split("\n\n", trim: true)
    |> Enum.reduce([], fn el, acc -> parse_block(el, acc, resources) end)
    |> build_prosemirror_doc()
  end

  defp build_prosemirror_doc(content) do
    %{
      "type" => "doc",
      "content" => content
    }
  end

  defp parse_block(block, acc, resources) do
    cond do
      String.starts_with?(block, "- ") ->
        acc ++ parse_bullet_list(block, resources)

      String.starts_with?(block, "1. ") ->
        acc ++ parse_numbered_list(block, resources)

      String.match?(block, ~r/^#+\s/) ->
        if String.contains?(block, "\n") do
          [heading, rest] = String.split(block, "\n", parts: 2)
          acc ++ parse_heading(heading) ++ parse_block(rest, [], resources)
        else
          acc ++ parse_heading(block)
        end

      true ->
        acc ++ parse_paragraph(block, resources)
    end
  end

  defp parse_numbered_list(block, resources) do
    items =
      block
      |> String.split("\n", trim: true)
      |> Enum.map(fn item -> parse_numbered_item(item, resources) end)

    [
      %{
        "type" => "orderedList",
        "content" => items,
        "attrs" => %{"start" => 1}
      },
      %{"type" => "paragraph"}
    ]
  end

  defp parse_numbered_item(item, resources) do
    cleaned_item = String.replace(item, ~r/^\d+\./, "") |> String.trim()

    %{
      "type" => "listItem",
      "content" => [%{"type" => "paragraph", "content" => parse_text(cleaned_item, resources)}]
    }
  end

  defp parse_bullet_list(block, resources) do
    items =
      block
      |> String.split("\n", trim: true)
      |> Enum.map(fn item -> parse_bullet_item(item, resources) end)

    [
      %{
        "type" => "bulletList",
        "content" => items
      },
      %{"type" => "paragraph"}
    ]
  end

  defp parse_bullet_item(item, resources) do
    cleaned_item = String.trim_leading(item, "- ")

    %{
      "type" => "listItem",
      "content" => [%{"type" => "paragraph", "content" => parse_text(cleaned_item, resources)}]
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

  defp parse_paragraph(block, resources) do
    [
      %{
        "type" => "paragraph",
        "content" => parse_text(block, resources)
      },
      %{"type" => "paragraph"}
    ]
  end

  defp parse_text(text, resources) do
    # support for bold text (e.g **text**) and mentioned people (@person)
    regex = ~r/(\*\*.*?\*\*|@\w+)/

    String.split(text, regex, include_captures: true, trim: true)
    |> Enum.map(fn text -> build_text_node(text, resources) end)
  end

  defp build_text_node(text, resources) do
    cond do
      String.starts_with?(text, "**") && String.ends_with?(text, "**") ->
        bold_text = String.trim(text, "**")

        %{
          "type" => "text",
          "text" => bold_text,
          "marks" => [%{"type" => "bold"}]
        }

      String.starts_with?(text, "@") ->
        person = get_mentioned_person(text, resources)

        %{
          "attrs" => %{
            "id" => OperatelyWeb.Paths.person_id(person),
            "label" => person.full_name
          },
          "type" => "mention"
        }

      true ->
        %{
          "type" => "text",
          "text" => text
        }
    end
  end

  defp get_mentioned_person(person, resources) do
    person = person |> String.trim_leading("@") |> String.to_atom()
    Operately.Demo.Resources.get(resources, person)
  end
end
