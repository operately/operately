defmodule Operately.RichContent.MarkdownTables do
  @moduledoc """
  Parses pipe tables for `FromMarkdown`, used by MCP tools and demo-data creation,
  preserving other content and rejecting rows with excess cells. The web editor
  produces Tiptap JSON directly, and the CLI uses its own Markdown converter.
  """

  alias Operately.RichContent.MarkdownTableCell

  def parse(markdown, parse_blocks, opts) do
    markdown |> String.replace("\r\n", "\n") |> String.split("\n") |> scan([], [], parse_blocks, opts)
  end

  defp scan([], pending, nodes, parse_blocks, _opts), do: {:ok, nodes ++ flush(pending, parse_blocks)}

  defp scan([line | rest] = lines, pending, nodes, parse_blocks, opts) do
    cond do
      # Match a code fence (3+ backticks or tildes), allowing up to 3 leading spaces and capturing trailing language text.
      fence = Regex.run(~r/^ {0,3}(`{3,}|~{3,})(.*)$/, line) ->
        [_, delimiter, language] = fence
        closing = Regex.compile!("^ {0,3}" <> String.first(delimiter) <> "{" <> to_string(String.length(delimiter)) <> ",}\\s*$")
        {body, remaining} = Enum.split_while(rest, &(not Regex.match?(closing, &1)))
        remaining = if remaining == [], do: [], else: tl(remaining)
        code = %{"type" => "codeBlock", "attrs" => %{"language" => String.trim(language)}, "content" => code_text(body)}
        scan(remaining, [], nodes ++ flush(pending, parse_blocks) ++ [code], parse_blocks, opts)

      table_start?(lines) ->
        [header, _separator | body] = lines
        {rows, remaining} = Enum.split_while(body, &table_body_line?/1)
        width = length(split_row(header))
        cells = Enum.map(rows, &split_row/1)

        if Enum.any?(cells, &(length(&1) > width)) do
          {:error, :invalid_arguments}
        else
          table = %{"type" => "table", "content" => [row(split_row(header), "tableHeader", opts) | Enum.map(cells, &row(&1 ++ List.duplicate("", width - length(&1)), "tableCell", opts))]}
          scan(remaining, [], nodes ++ flush(pending, parse_blocks) ++ [table], parse_blocks, opts)
        end

      true ->
        scan(rest, [line | pending], nodes, parse_blocks, opts)
    end
  end

  defp flush(lines, parse_blocks), do: lines |> Enum.reverse() |> Enum.join("\n") |> String.trim("\n") |> parse_blocks.()
  defp code_text([]), do: []
  defp code_text(lines), do: [%{"type" => "text", "text" => Enum.join(lines, "\n")}]

  defp table_start?([header, separator | _]) do
    cells = split_row(separator)

    not block_start?(header) and String.trim(header) != "" and not String.starts_with?(separator, "    ") and
      String.contains?(separator, ["|", ":"]) and cells != [] and length(split_row(header)) == length(cells) and Enum.all?(cells, &Regex.match?(~r/^:?-+:?$/, &1))
  end

  defp table_start?(_), do: false

  # GFM accepts a single value as a short body row; only a blank line or a new block ends it.
  defp table_body_line?(line), do: String.trim(line) != "" and not block_start?(line)

  defp block_start?(line) do
    Regex.match?(~r/^( {4}|\t| {0,3}(\#{1,6}(?:\s|$)|`{3,}|~{3,}|>|(?:[-+*]|\d+[.)])\s))/, line)
  end

  # Split only unescaped pipes. Keep other escapes for the inline Markdown parser.
  defp split_row(line) do
    line
    |> split_pipes("", [])
    |> Enum.map(&String.trim/1)
    |> drop_edge_empty()
    |> Enum.reverse()
    |> drop_edge_empty()
    |> Enum.reverse()
    |> Enum.map(&String.replace(&1, "\\|", "|"))
  end

  defp split_pipes("", cell, cells), do: Enum.reverse([cell | cells])
  defp split_pipes(<<"\\", char::utf8, rest::binary>>, cell, cells), do: split_pipes(rest, cell <> <<"\\", char::utf8>>, cells)
  defp split_pipes(<<"|", rest::binary>>, cell, cells), do: split_pipes(rest, "", [cell | cells])
  defp split_pipes(<<char::utf8, rest::binary>>, cell, cells), do: split_pipes(rest, cell <> <<char::utf8>>, cells)
  defp drop_edge_empty(["" | rest]), do: rest
  defp drop_edge_empty(cells), do: cells

  defp row(cells, type, opts) do
    %{
      "type" => "tableRow",
      "content" =>
        Enum.map(cells, fn cell ->
          %{"type" => type, "attrs" => %{"colspan" => 1, "rowspan" => 1, "colwidth" => nil}, "content" => [%{"type" => "paragraph", "content" => MarkdownTableCell.parse(cell, opts)}]}
        end)
    }
  end
end
