defmodule Operately.MD.RichText do
  @moduledoc """
  Serializes Operately rich text data (ProseMirror-like JSON) to GitHub Flavored Markdown.
  """

  def render(%{"type" => "doc", "content" => blocks}) when is_list(blocks) do
    blocks
    |> Enum.map(&render_block/1)
    |> Enum.join("\n\n")
  end

  def render(_), do: ""

  # Block nodes
  defp render_block(%{"type" => "paragraph", "content" => children}) do
    render_inline(children)
  end

  defp render_block(%{"type" => "heading", "attrs" => %{"level" => level}, "content" => children}) do
    prefix = String.duplicate("#", level)
    "#{prefix} #{render_inline(children)}"
  end

  defp render_block(%{"type" => "blockquote", "content" => blocks}) do
    blocks
    |> Enum.map(&render_block/1)
    |> Enum.map(fn block -> "> " <> String.replace(block, "\n", "\n> ") end)
    |> Enum.join("\n")
  end

  defp render_block(%{"type" => "codeBlock", "attrs" => attrs, "content" => [%{"type" => "text", "text" => code}]}) do
    lang = Map.get(attrs, "language", "")
    "```#{lang}\n#{code}\n```"
  end

  defp render_block(%{"type" => "horizontalRule"}) do
    "---"
  end

  defp render_block(%{"type" => "bulletList", "content" => items}) do
    items
    |> Enum.map(&"* #{render_list_item(&1)}")
    |> Enum.join("\n")
  end

  defp render_block(%{"type" => "orderedList", "attrs" => %{"start" => start}, "content" => items}) do
    items
    |> Enum.with_index(start)
    |> Enum.map(fn {item, idx} -> "#{idx}. #{render_list_item(item)}" end)
    |> Enum.join("\n")
  end

  defp render_block(%{"type" => "orderedList", "content" => items}) do
    items
    |> Enum.with_index(1)
    |> Enum.map(fn {item, idx} -> "#{idx}. #{render_list_item(item)}" end)
    |> Enum.join("\n")
  end

  defp render_block(%{"type" => "blob", "attrs" => attrs}) do
    alt = Map.get(attrs, "alt", "")
    src = Map.get(attrs, "src", "")
    title = Map.get(attrs, "title", nil)
    filetype = Map.get(attrs, "filetype", "")

    if filetype != "" and not String.starts_with?(filetype, "image/") do
      "[#{alt || "File"}](#{src}#{if title, do: " \"#{title}\"", else: ""})"
    else
      "![#{alt}](#{src}#{if title, do: " \"#{title}\"", else: ""})"
    end
  end

  defp render_block(%{"type" => "mention", "attrs" => %{"label" => label}}) do
    "@#{label}"
  end

  defp render_block(%{"type" => "listItem", "content" => content}) do
    render_inline(content)
  end

  defp render_block(%{"type" => "hardBreak"}) do
    "  \n"
  end

  defp render_block(%{"type" => "text", "text" => text}) do
    text
  end

  defp render_block(_), do: ""

  defp render_list_item(%{"type" => "listItem", "content" => content}) do
    # List item content can contain both inline nodes (text, mentions, etc.)
    # and block nodes (paragraphs). We need to handle both cases.
    content
    |> Enum.map(fn node ->
      case node do
        %{"type" => "paragraph", "content" => children} -> render_inline(children)
        %{"type" => "text"} -> render_inline_node(node)
        %{"type" => "mention"} -> render_inline_node(node)
        %{"type" => "blob"} -> render_inline_node(node)
        _ -> render_inline_node(node)
      end
    end)
    |> Enum.join("")
  end

  defp render_list_item(_), do: ""

  # Inline nodes and marks
  defp render_inline(nodes) when is_list(nodes) do
    nodes
    |> Enum.map(&render_inline_node/1)
    |> Enum.join("")
  end

  defp render_inline(_), do: ""

  defp render_inline_node(%{"type" => "text", "text" => text, "marks" => marks}) when is_list(marks) do
    apply_marks(text, marks)
  end

  defp render_inline_node(%{"type" => "text", "text" => text}), do: text

  defp render_inline_node(%{"type" => "mention", "attrs" => %{"label" => label}}), do: "@#{label}"
  defp render_inline_node(%{"type" => "blob", "attrs" => attrs}), do: render_block(%{"type" => "blob", "attrs" => attrs})
  defp render_inline_node(_), do: ""

  defp apply_marks(text, marks) do
    Enum.reduce(marks, text, fn mark, acc ->
      case mark do
        %{"type" => "bold"} ->
          "**#{acc}**"

        %{"type" => "italic"} ->
          "_#{acc}_"

        %{"type" => "strike"} ->
          "~~#{acc}~~"

        %{"type" => "code"} ->
          "`#{acc}`"

        %{"type" => "link", "attrs" => %{"href" => href, "title" => title}} ->
          "[#{acc}](#{href}#{if title, do: " \"#{title}\"", else: ""})"

        %{"type" => "link", "attrs" => %{"href" => href}} ->
          "[#{acc}](#{href})"

        %{"type" => "highlight", "attrs" => %{"highlight" => highlight}} when not is_nil(highlight) ->
          "<!-- highlight: #{highlight} -->#{acc}<!-- /highlight -->"

        _ ->
          acc
      end
    end)
  end
end
