defmodule Operately.I18n.ElixirExtractor do
  @moduledoc false

  alias Operately.I18n.Message

  def extract_file(path) do
    path
    |> File.read!()
    |> extract_contents(path)
  end

  def extract_contents(source, path) when is_binary(source) do
    ast = parse_source(source, path)
    {_ast, messages} = Macro.prewalk(ast, [], &collect(&1, &2, path))
    Enum.reverse(messages)
  end

  defp parse_source(source, path) do
    if Path.extname(path) == ".heex" do
      parse_heex(source, path)
    else
      Code.string_to_quoted!(source, file: path, columns: true)
    end
  end

  defp parse_heex(source, path, opts \\ []) do
    Phoenix.LiveView.TagEngine.compile(source,
      Keyword.merge(opts, file: path, caller: __ENV__, tag_handler: Phoenix.LiveView.HTMLEngine)
    )
  end

  defp collect({:sigil_H, meta, [{:<<>>, contents_meta, [source]}, _modifiers]}, acc, path) when is_binary(source) do
    line = meta[:line] + if(meta[:delimiter] in ["\"\"\"", "'''"], do: 1, else: 0)
    ast = parse_heex(source, path, line: line, indentation: contents_meta[:indentation] || 0)
    {ast, acc}
  end

  defp collect({:gettext, meta, args} = ast, acc, path) do
    collect_singular(ast, acc, path, meta, literal_strings(args), 0)
  end

  defp collect({:dgettext, meta, args} = ast, acc, path) do
    collect_singular(ast, acc, path, meta, literal_strings(args), 1)
  end

  defp collect({:pgettext, meta, args} = ast, acc, path) do
    collect_context_singular(ast, acc, path, meta, literal_strings(args), 0)
  end

  defp collect({:dpgettext, meta, args} = ast, acc, path) do
    collect_context_singular(ast, acc, path, meta, literal_strings(args), 1)
  end

  defp collect({:ngettext, meta, args} = ast, acc, path) do
    collect_plural(ast, acc, path, meta, literal_strings(args), 0)
  end

  defp collect({:dngettext, meta, args} = ast, acc, path) do
    collect_plural(ast, acc, path, meta, literal_strings(args), 1)
  end

  defp collect({:npgettext, meta, args} = ast, acc, path) do
    collect_context_plural(ast, acc, path, meta, literal_strings(args), 0)
  end

  defp collect({:dnpgettext, meta, args} = ast, acc, path) do
    collect_context_plural(ast, acc, path, meta, literal_strings(args), 1)
  end

  defp collect(ast, acc, _path), do: {ast, acc}

  defp collect_singular(ast, acc, path, meta, strings, drop) do
    case Enum.drop(strings, drop) do
      [msgid | _] -> {ast, [singular(msgid, nil, path, meta) | acc]}
      _ -> {ast, acc}
    end
  end

  defp collect_context_singular(ast, acc, path, meta, strings, drop) do
    case Enum.drop(strings, drop) do
      [msgctxt, msgid | _] -> {ast, [singular(msgid, msgctxt, path, meta) | acc]}
      _ -> {ast, acc}
    end
  end

  defp collect_plural(ast, acc, path, meta, strings, drop) do
    case Enum.drop(strings, drop) do
      [msgid, msgid_plural | _] -> {ast, [plural(msgid, msgid_plural, nil, path, meta) | acc]}
      _ -> {ast, acc}
    end
  end

  defp collect_context_plural(ast, acc, path, meta, strings, drop) do
    case Enum.drop(strings, drop) do
      [msgctxt, msgid, msgid_plural | _] -> {ast, [plural(msgid, msgid_plural, msgctxt, path, meta) | acc]}
      _ -> {ast, acc}
    end
  end

  defp literal_strings(args) when is_list(args) do
    args
    |> Enum.take_while(&is_binary/1)
  end

  defp literal_strings(_), do: []

  defp singular(msgid, msgctxt, path, meta) do
    %Message{
      msgid: msgid,
      msgctxt: msgctxt,
      references: [reference(path, meta)],
      extracted_comments: ["elixir"]
    }
  end

  defp plural(msgid, msgid_plural, msgctxt, path, meta) do
    %Message{
      msgid: msgid,
      msgid_plural: msgid_plural,
      msgctxt: msgctxt,
      references: [reference(path, meta)],
      extracted_comments: ["elixir"]
    }
  end

  defp reference(path, meta) do
    {path, Keyword.get(meta, :line, 1)}
  end
end
