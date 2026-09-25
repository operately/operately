defmodule Prosemirror2Html do
  @moduledoc """
  Prosemirror2Html is a library that converts Prosemirror JSON to HTML.
  Based on the ruby implementation of Prosemirror2Html.
  Link: https://github.com/inputhq/prosemirror_to_html
  """

  defmodule Options do
    defstruct domain: nil, highlights: %{}
  end

  def convert(%{"type" => "doc", "content" => content}, opts = %__MODULE__.Options{}) do
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

  def convert_node(%{"type" => "table", "content" => rows}, opts) do
    {headers, body} = Enum.split_while(rows, fn row -> Enum.all?(row["content"] || [], &(&1["type"] == "tableHeader")) end)
    header_html = if headers == [], do: "", else: wrap(Enum.map_join(headers, &convert_node(&1, opts)), "thead")
    body_html = wrap(Enum.map_join(body, &convert_node(&1, opts)), "tbody")

    wrap(header_html <> body_html, "table", style: "border-collapse: collapse; width: 100%; margin: 16px 0;")
  end

  def convert_node(%{"type" => "tableRow", "content" => cells}, opts) do
    wrap(Enum.map_join(cells, &convert_node(&1, opts)), "tr")
  end

  def convert_node(%{"type" => type, "content" => paragraphs}, opts) when type in ["tableCell", "tableHeader"] do
    html = Enum.map_join(paragraphs, fn paragraph ->
      (paragraph["content"] || [])
      |> Enum.map_join(&convert_table_inline(&1, opts))
      |> wrap("p", style: "margin: 0;")
    end)

    attrs = [style: "border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top;"]
    if type == "tableHeader", do: wrap(html, "th", attrs ++ [scope: "col"]), else: wrap(html, "td", attrs)
  end

  def convert_node(%{"type" => "listItem", "content" => content}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("li")
  end

  def convert_node(%{"type" => "taskList", "content" => content}, opts) do
    content |> Enum.map_join(&convert_node(&1, opts)) |> wrap("ul", style: "list-style: none; padding-left: 20px;")
  end

  def convert_node(%{"type" => "taskItem", "content" => content} = node, opts) do
    checkbox = if get_in(node, ["attrs", "checked"]) == true, do: "☑", else: "☐"
    wrap(checkbox <> " " <> Enum.map_join(content, &convert_node(&1, opts)), "li")
  end

  def convert_node(%{"type" => "bulletList", "content" => content}, opts) do
    content
    |> Enum.map(fn node -> convert_node(node, opts) end)
    |> Enum.join("")
    |> wrap("ul")
  end

  def convert_node(%{"type" => "orderedList", "content" => content} = node, opts) do
    html =
      content
      |> Enum.map(fn child -> convert_node(child, opts) end)
      |> Enum.join("")

    case get_in(node, ["attrs", "start"]) do
      start when is_integer(start) and start != 1 -> wrap(html, "ol", start: start)
      _ -> wrap(html, "ol")
    end
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

  def convert_node(%{"type" => "text", "text" => text, "marks" => marks}, opts) do
    marks
    |> Enum.reverse()
    |> Enum.reduce(escape(text), fn mark, acc -> convert_mark(acc, mark, opts) end)
  end

  def convert_node(%{"type" => "text", "text" => text}, _opts) do
    escape(text)
  end

  def convert_node(%{"type" => "mention", "attrs" => %{"id" => _id, "label" => name}}, _opts) do
    first_name = String.split(name, " ") |> Enum.at(0)
    wrap(escape(first_name), "strong")
  end

  def convert_node(%{"type" => "blob", "attrs" => %{"title" => title, "src" => src}}, opts) do
    "<div>&#128206; " <> wrap(escape(title), "a", href: "#{opts.domain}#{src}") <> "</div>"
  end

  def convert_node(%{"content" => content}, opts) when is_list(content) do
    content
    |> Enum.map(&convert_node(&1, opts))
    |> Enum.join("")
  end

  def convert_node(%{"text" => text}, _opts) when is_binary(text), do: escape(text)
  def convert_node(_node, _opts), do: ""

  defp convert_table_inline(%{"type" => "mention", "attrs" => %{"label" => label}}, _opts), do: wrap(escape(label), "strong")

  defp convert_table_inline(%{"type" => "text", "text" => text} = node, opts) do
    text |> String.split(~r/\r\n?|\n/) |> Enum.map_join("<br>", &convert_node(%{node | "text" => &1}, opts))
  end

  defp convert_table_inline(node, opts), do: convert_node(node, opts)

  #
  # Marks
  #

  def convert_mark(text, %{"type" => "bold"}, _opts) do
    wrap(text, "strong")
  end

  def convert_mark(text, %{"type" => "italic"}, _opts) do
    wrap(text, "em")
  end

  def convert_mark(text, %{"type" => "code"}, _opts) do
    wrap(text, "code")
  end

  def convert_mark(text, %{"type" => "link", "attrs" => %{"href" => href}}, _opts) when is_binary(href) do
    scheme = href |> String.replace(~r/[\x00-\x20]/, "") |> URI.parse() |> Map.get(:scheme)
    if scheme in [nil, "http", "https", "mailto", "tel"], do: wrap(text, "a", href: href), else: text
  end

  def convert_mark(text, %{"type" => "strike"}, _opts) do
    wrap(text, "strike")
  end

  def convert_mark(text, %{"type" => "underline"}, _opts) do
    wrap(text, "u")
  end

  def convert_mark(text, %{"attrs" => %{"highlight" => highlight}, "type" => "highlight"}, opts) do
    style = opts.highlights[highlight] || ""

    wrap(text, "mark", [{"style", style}])
  end

  def convert_mark(text, _mark, _opts), do: text

  defp wrap(html, tag) do
    wrap(html, tag, [])
  end

  defp wrap(html, tag, attrs) do
    attrs = attrs
            |> Enum.map(fn {key, value} -> "#{key}=\"#{escape(to_string(value))}\"" end)
            |> Enum.join(" ")

    attrs = if attrs == "", do: "", else: " #{attrs}"

    "<#{tag}#{attrs}>#{html}</#{tag}>"
  end

  defp escape(text), do: text |> Phoenix.HTML.html_escape() |> Phoenix.HTML.safe_to_string()
end
