defmodule Prosemirror2Html do
  @moduledoc """
  Prosemirror2Html is a library that converts Prosemirror JSON to HTML.
  Based on the ruby implementation of Prosemirror2Html.
  Link: https://github.com/inputhq/prosemirror_to_html
  """

  def convert(%{"type" => "doc", "content" => content}, opts \\ []) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
  end

  def convert_node(%{"type" => "paragraph", "content" => content}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("p")
  end

  def convert_node(%{"type" => "paragraph"}, _opts) do
    wrap("", "p")
  end

  def convert_node(%{"type" => "listItem", "content" => content}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("li")
  end

  def convert_node(%{"type" => "bulletList", "content" => content}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("ul")
  end

  def convert_node(%{"type" => "orderedList", "content" => content, "attrs" => %{"start" => 1}}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("ol")
  end

  def convert_node(%{"type" => "heading", "attrs" => %{"level" => level}, "content" => content}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("h#{level}")
  end

  def convert_node(%{"type" => "blockquote", "content" => content}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("blockquote")
  end

  def convert_node(%{"type" => "codeBlock", "content" => content}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("pre")
  end

  def convert_node(%{"type" => "hardBreak"}, _opts) do
    "<br>"
  end

  def convert_node(%{"type" => "horizontalRule"}, _opts) do
    "<hr>"
  end

  def convert_node(%{"type" => "text", "text" => text, "marks" => marks}, _opts) do
    marks
    |> Enum.reverse()
    |> Enum.reduce(text, fn mark, acc -> convert_mark(acc, mark) end)
  end

  def convert_node(%{"type" => "text", "text" => text}, _opts) do
    text
  end

  def convert_node(%{"type" => "mention", "attrs" => %{"id" => _id, "label" => name}}, _opts) do
    wrap(name, "strong")
  end

  def convert_node(%{"type" => "blob", "attrs" => %{"title" => title, "src" => src}}, opts) do
    domain = Keyword.get(opts, :domain, nil) || raise("Missing domain option")

    "<div>&#128206; <a href=\"#{domain}#{src}\">#{title}</a></div>"
  end

  #
  # Marks
  #

  def convert_mark(text, %{"type" => "bold"}) do
    wrap(text, "strong")
  end

  def convert_mark(text, %{"type" => "italic"}) do
    wrap(text, "em")
  end

  def convert_mark(text, %{"type" => "code"}) do
    wrap(text, "code")
  end

  def convert_mark(text, %{"type" => "link", "attrs" => %{"href" => href}}) do
    wrap(text, "a", href: href)
  end

  def convert_mark(text, %{"type" => "strike"}) do
    wrap(text, "strike")
  end

  defp wrap(html, tag) do
    wrap(html, tag, [])
  end

  defp wrap(html, tag, attrs) do
    attrs = attrs
            |> Enum.map(fn {key, value} -> "#{key}=\"#{value}\"" end)
            |> Enum.join(" ")

    attrs = if attrs == "", do: "", else: " #{attrs}"

    "<#{tag}#{attrs}>#{html}</#{tag}>"
  end
end
