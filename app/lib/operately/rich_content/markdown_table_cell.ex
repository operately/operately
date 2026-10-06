defmodule Operately.RichContent.MarkdownTableCell do
  @moduledoc "Maps inline Markdown to the paragraph-only table cell schema shared with the web editor."

  use Gettext, backend: OperatelyWeb.Gettext

  def parse(text, opts) do
    {text, codes} = protect_code_spans(text)
    text = protect_escaped_angle_brackets(text)
    opts = Keyword.put(opts, :table_code_spans, codes)
    # A plain prefix keeps cell text such as '# Title' from becoming a block.
    [{"p", _, [first | rest], _}] = parse_ast("cell " <> text)
    inline([String.replace_prefix(first, "cell ", "") | rest], [], opts)
  end

  # Earmark 1.4.46 incorrectly types Context.value as strings only, excluding AST tuples.
  # Capture the parser dynamically to isolate that inference bug without suppressing our checks.
  @spec parse_ast(String.t()) :: EarmarkParser.ast()
  defp parse_ast(text) do
    parser = Function.capture(EarmarkParser, :as_ast, 2)
    {_, ast, _} = parser.(text, pure_links: false)
    ast
  end

  # Preserve escaped '<' as an entity until after break detection; paired backslashes leave it unescaped.
  defp protect_escaped_angle_brackets(text) do
    Regex.replace(~r/\\\\|\\</, text, fn
      "\\<" -> "&lt;"
      backslashes -> backslashes
    end)
  end

  # Earmark collapses code whitespace. Use placeholders so it can still parse surrounding
  # marks/links; restore literal syntax wherever it interprets a placeholder as ordinary text.
  defp protect_code_spans(text) do
    pattern = ~r/\\.|(`+)(?!`)(.+?)(?<!`)\1(?!`)/s
    prefix = code_prefix(text, "operately-code-")

    codes =
      Regex.scan(pattern, text)
      |> Enum.filter(fn
        [_source, _fence, _code] -> true
        _ -> false
      end)
      |> Map.new(fn [source, _fence, code] ->
        token = prefix <> Base.encode64(source)
        code = if String.starts_with?(code, " ") and String.ends_with?(code, " ") and String.trim(code) != "", do: String.slice(code, 1, String.length(code) - 2), else: code
        {token, %{source: source, text: code}}
      end)

    protected =
      Regex.replace(pattern, text, fn source, fence, _code ->
        if fence == "", do: source, else: "`" <> prefix <> Base.encode64(source) <> "`"
      end)

    {protected, codes}
  end

  defp code_prefix(text, prefix) do
    if String.contains?(text, prefix), do: code_prefix(text, "_" <> prefix), else: prefix
  end

  defp restore_code_syntax(text, opts) do
    Enum.reduce(opts[:table_code_spans], text, fn {token, code}, text -> String.replace(text, "`" <> token <> "`", code.source) end)
  end

  defp inline(nodes, marks, opts), do: Enum.flat_map(nodes, &node(&1, marks, opts))

  defp node(text, marks, opts) when is_binary(text) do
    # Decode entities after recognizing real breaks, keeping exported literal '<br>' text intact.
    text
    |> restore_code_syntax(opts)
    |> String.split(~r/(<br\s*\/?\s*>)/i, include_captures: true, trim: true)
    |> Enum.flat_map(fn part ->
      if Regex.match?(~r/^<br\s*\/?\s*>$/i, part), do: [%{"type" => "hardBreak"}], else: mentions(HtmlEntities.decode(part), marks, opts)
    end)
  end

  defp node({"code", _, text, _}, marks, opts) do
    code = Enum.join(text)

    value =
      case Map.get(opts[:table_code_spans], code) do
        nil -> code
        protected -> protected.text
      end

    [text_node(value, marks ++ [%{"type" => "code"}])]
  end

  defp node({"br", _, _, _}, _marks, _opts), do: [%{"type" => "hardBreak"}]

  defp node({tag, _, children, _}, marks, opts) when tag in ["strong", "em", "del"] do
    kind = %{"strong" => "bold", "em" => "italic", "del" => "strike"}[tag]
    inline(children, marks ++ [%{"type" => kind}], opts)
  end

  defp node({"a", attrs, children, _}, marks, opts) do
    inline(children, marks ++ [link_mark(attrs, opts)], opts)
  end

  # Images are outside the cell schema; retain their label and destination as a link.
  defp node({"img", attrs, _, _}, marks, opts) do
    attrs = Map.new(attrs)
    label = if attrs["alt"] in [nil, ""], do: gettext("Image"), else: attrs["alt"]
    [text_node(label |> restore_code_syntax(opts) |> HtmlEntities.decode(), marks ++ [link_mark([{"href", attrs["src"]}, {"title", attrs["title"]}], opts)])]
  end

  defp node({_tag, _attrs, children, _meta}, marks, opts), do: inline(children, marks, opts)

  defp link_mark(attrs, opts) do
    attrs =
      attrs |> Map.new() |> Map.take(["href", "title"]) |> Map.new(fn {key, value} -> {key, if(is_binary(value), do: value |> restore_code_syntax(opts) |> HtmlEntities.decode(), else: value)} end)

    %{"type" => "link", "attrs" => attrs}
  end

  defp mentions(text, marks, opts) do
    text
    |> String.split(~r/(@\w+)/u, include_captures: true, trim: true)
    |> Enum.map(fn part ->
      resolver = Keyword.get(opts, :mention_resolver)
      resolved = if String.starts_with?(part, "@") and is_function(resolver, 1), do: resolver.(String.trim_leading(part, "@"))

      case resolved do
        %{id: id, label: label} -> put_marks(%{"type" => "mention", "attrs" => %{"id" => id, "label" => label}}, marks)
        _ -> text_node(part, marks)
      end
    end)
  end

  defp text_node(text, marks), do: put_marks(%{"type" => "text", "text" => text}, marks)
  defp put_marks(node, []), do: node
  defp put_marks(node, marks), do: Map.put(node, "marks", marks)
end
