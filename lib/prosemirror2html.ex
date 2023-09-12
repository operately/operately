defmodule Prosemirror2Html do
  @moduledoc """
  Prosemirror2Html is a library that converts Prosemirror JSON to HTML.
  Based on the ruby implementation of Prosemirror2Html.
  Link: https://github.com/inputhq/prosemirror_to_html
  """

  def convert(%{"type" => "doc", "content" => content}) do
    content
    |> Enum.map(&convert_node/1)
    |> Enum.join("")
  end

  def convert_node(%{"type" => "paragraph", "content" => content}) do
    content
    |> Enum.map(&convert_node/1)
    |> Enum.join("")
    |> wrap("p")
  end

  def convert_node(%{"type" => "paragraph"}) do
    wrap("", "p")
  end

  def convert_node(%{"type" => "listItem", "content" => content}) do
    content
    |> Enum.map(&convert_node/1)
    |> Enum.join("")
    |> wrap("li")
  end

  def convert_node(%{"type" => "bulletList", "content" => content}) do
    content
    |> Enum.map(&convert_node/1)
    |> Enum.join("")
    |> wrap("ul")
  end

  def convert_node(%{"type" => "orderedList", "content" => content, "attrs" => %{"start" => 1}}) do
    content
    |> Enum.map(&convert_node/1)
    |> Enum.join("")
    |> wrap("ol")
  end

  def convert_node(%{"type" => "heading", "attrs" => %{"level" => level}, "content" => content}) do
    content
    |> Enum.map(&convert_node/1)
    |> Enum.join("")
    |> wrap("h#{level}")
  end

  def convert_node(%{"type" => "blockquote", "content" => content}) do
    content
    |> Enum.map(&convert_node/1)
    |> Enum.join("")
    |> wrap("blockquote")
  end

  def convert_node(%{"type" => "codeBlock", "content" => content}) do
    content
    |> Enum.map(&convert_node/1)
    |> Enum.join("")
    |> wrap("pre")
  end

  def convert_node(%{"type" => "hardBreak"}) do
    "<br>"
  end

  def convert_node(%{"type" => "horizontalRule"}) do
    "<hr>"
  end

  def convert_node(%{"type" => "image", "attrs" => %{"src" => src}}) do
    "<img src=\"#{src}\">"
  end

  def convert_node(%{"type" => "text", "text" => text, "marks" => marks}) do
    marks
    |> Enum.reverse()
    |> Enum.reduce(text, fn mark, acc -> convert_mark(acc, mark) end)
  end

  def convert_node(%{"type" => "text", "text" => text}) do
    text
  end

  def convert_node(%{"attrs" => %{"id" => _id, "label" => name}, "type" => "mention"}) do
    wrap(name, "strong")
  end

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
