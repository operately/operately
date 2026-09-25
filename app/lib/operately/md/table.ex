defmodule Operately.MD.Table do
  @moduledoc "Canonical pipe-table export, aligned with the frontend exporter and shared fixtures."

  @mark_order ["link", "bold", "italic", "strike", "highlight", "code"]

  def render(%{"content" => []}), do: ""

  def render(%{"content" => rows}) do
    width = rows |> Enum.map(&length(&1["content"] || [])) |> Enum.max()
    rendered = Enum.map(rows, fn row -> Enum.map(row["content"] || [], &render_cell/1) end)
    header? = Enum.all?(hd(rows)["content"] || [], &(&1["type"] == "tableHeader"))
    {header, body} = if header?, do: {hd(rendered), tl(rendered)}, else: {[], rendered}

    [header, List.duplicate("---", width) | body]
    |> Enum.map_join("\n", fn cells ->
      padded = cells ++ List.duplicate("", max(width - length(cells), 0))
      "| " <> Enum.join(padded, " | ") <> " |"
    end)
  end

  defp render_cell(cell) do
    (cell["content"] || [])
    |> Enum.map_join("<br>", &render_inline(&1["content"] || [], @mark_order))
    |> String.replace("|", "\\|")
  end

  defp render_inline(nodes, []), do: Enum.map_join(nodes, &render_leaf/1)

  defp render_inline(nodes, [kind | rest]) do
    nodes
    |> Enum.chunk_by(&find_mark(&1, kind))
    |> Enum.map_join(fn group ->
      case find_mark(hd(group), kind) do
        nil -> render_inline(group, rest)
        %{"type" => "code"} -> code_span(Enum.map_join(group, &(&1["text"] || "")))
        mark -> wrap_mark(render_inline(group, rest), mark)
      end
    end)
  end

  defp find_mark(node, kind) do
    case Enum.find(node["marks"] || [], &(&1["type"] == kind)) do
      %{"type" => "link", "attrs" => attrs} -> %{"type" => "link", "attrs" => Map.merge(%{"href" => nil, "title" => nil}, Map.take(attrs, ["href", "title"]))}
      mark -> mark
    end
  end

  defp render_leaf(%{"type" => "hardBreak"}), do: "<br>"
  defp render_leaf(%{"type" => "mention", "attrs" => %{"label" => label}}), do: "@" <> escape_text(label)
  defp render_leaf(%{"text" => text}), do: escape_text(text)
  defp render_leaf(_), do: ""

  defp escape_text(text) do
    text
    |> String.replace(~r/[\\`*_\[\]~]/, "\\\\\\0")
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace(~r/\r\n?|\n/, "<br>")
  end

  defp wrap_mark(text, %{"type" => "link", "attrs" => attrs}) do
    href =
      Regex.replace(~r/[\s<>"\\()|]/, attrs["href"] || "", fn char ->
        URI.encode(char, fn _ -> false end)
      end)

    title = if attrs["title"] not in [nil, ""], do: " \"" <> (attrs["title"] |> String.replace(~r/[\\"]/, "\\\\\\0") |> String.replace(~r/\r\n?|\n/, " ")) <> "\"", else: ""
    "[#{text}](#{href}#{title})"
  end

  defp wrap_mark(text, %{"type" => kind}) when kind in ["bold", "italic", "strike"] do
    delimiter = %{"bold" => "**", "italic" => "_", "strike" => "~~"}[kind]

    Regex.replace(~r/^(\s*)(.*?)(\s*)$/s, text, fn _, before, body, after_text ->
      if body == "", do: text, else: before <> delimiter <> body <> delimiter <> after_text
    end)
  end

  defp wrap_mark(text, %{"type" => "highlight", "attrs" => %{"highlight" => highlight}}) when highlight not in [nil, ""] do
    "<!-- highlight: #{escape_text(highlight)} -->#{text}<!-- /highlight -->"
  end

  defp wrap_mark(text, _), do: text

  defp code_span(text) do
    longest_run = Regex.scan(~r/`+/, text) |> Enum.map(fn [run] -> String.length(run) end) |> Enum.max(fn -> 0 end)
    fence = String.duplicate("`", longest_run + 1)
    pad? = String.starts_with?(text, "`") or String.ends_with?(text, "`") or (String.starts_with?(text, " ") and String.ends_with?(text, " ") and String.trim(text) != "")
    padding = if pad?, do: " ", else: ""
    fence <> padding <> String.replace(text, ~r/\r\n?|\n/, " ") <> padding <> fence
  end
end
