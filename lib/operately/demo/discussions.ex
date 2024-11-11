defmodule Operately.Demo.Discussions do
  alias Operately.Demo.Resources
  alias Operately.Operations.DiscussionPosting

  # no discussions to create
  def create_discussions(resources, nil), do: resources

  def create_discussions(resources, data) do
    Resources.create(resources, data, fn {resources, data} ->
      create_discussion(resources, data)
    end)
  end

  defp create_discussion(resources, data) do
    author = Resources.get(resources, data.author)
    space = Resources.get(resources, data.space)

    {:ok, discussion} = DiscussionPosting.run(author, space, %{
      title: data.title,
      content: from_markdown(data.content),
      post_as_draft: false,
      send_to_everyone: true,
      subscription_parent_type: :message,
      subscriber_ids: []
    })

    discussion
  end

  #
  # Poor man's Markdown to ProseMirror conversion.
  # Markdown support is limited to paragraphs and bullet points.
  #

  defp from_markdown(markdown) do
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
    if String.starts_with?(block, "- ") do
      acc ++ [parse_bullet_list(block)]
    else
      acc ++ parse_paragraph(block)
    end
  end

  defp parse_bullet_list(block) do
    items = 
      block
      |> String.split("\n", trim: true)
      |> Enum.map(&parse_bullet_item/1)

    %{
      "type" => "bulletList",
      "content" => items
    }
  end

  defp parse_bullet_item(item) do
    cleaned_item = String.trim_leading(item, "- ")

    %{
      "type" => "listItem",
      "content" => [%{"type" => "paragraph", "content" => [%{"type" => "text", "text" => cleaned_item}]}]
    }
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
