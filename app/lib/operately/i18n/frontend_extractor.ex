defmodule Operately.I18n.FrontendExtractor do
  @moduledoc false

  alias Operately.I18n.{Message, Placeholders}

  @translation_imports ["i18next", "/i18n", "@/i18n"]

  def extract_file(path) do
    path
    |> File.read!()
    |> extract_contents(path)
  end

  def extract_contents(source, path) when is_binary(source) do
    if translation_source?(source) do
      scan(source, path, 0, [])
    else
      []
    end
  end

  defp translation_source?(source) do
    Enum.any?(@translation_imports, &String.contains?(source, &1))
  end

  defp scan(source, _path, offset, acc) when offset >= byte_size(source) do
    Enum.reverse(acc)
  end

  defp scan(source, path, offset, acc) do
    rest = remaining(source, offset)

    cond do
      String.starts_with?(rest, "i18n.t(") and not identifier_before?(source, offset) ->
        collect_call(source, path, offset, acc, 7, 1, &singular_message/4)

      String.starts_with?(rest, "tn(") ->
        collect_call(source, path, offset, acc, 3, 2, &plural_message/5)

      String.starts_with?(rest, "t(") and not identifier_before?(source, offset) ->
        collect_call(source, path, offset, acc, 2, 1, &singular_message/4)

      String.starts_with?(rest, "i18nKey=") ->
        collect_call(source, path, offset, acc, 8, 1, fn msgid, _ctx, path, line ->
          singular_message(msgid, nil, path, line)
        end)

      true ->
        scan(source, path, offset + 1, acc)
    end
  end

  defp collect_call(source, path, offset, acc, prefix_size, string_count, builder) do
    start = skip_ws(source, offset + prefix_size)
    line = line_number(source, start)

    case take_strings(source, start, string_count, []) do
      {:ok, strings, next_offset} ->
        context = nearby_context(remaining(source, next_offset))
        message = apply_builder(builder, strings, context, path, line)
        scan(source, path, next_offset, [message | acc])

      :error ->
        scan(source, path, offset + prefix_size, acc)
    end
  end

  defp apply_builder(builder, [msgid], context, path, line) do
    builder.(msgid, context, path, line)
  end

  defp apply_builder(builder, [msgid, msgid_plural], context, path, line) do
    builder.(msgid, msgid_plural, context, path, line)
  end

  defp identifier_before?(_source, 0), do: false

  defp identifier_before?(source, offset) do
    <<char>> = binary_part(source, offset - 1, 1)
    char in ?0..?9 or char in ?A..?Z or char in ?a..?z or char in [?_, ?$, ?.]
  end

  defp take_strings(_source, offset, 0, acc), do: {:ok, Enum.reverse(acc), offset}

  defp take_strings(source, offset, count, acc) do
    offset = skip_ws(source, offset)

    case parse_string(source, offset) do
      {:ok, value, after_string} ->
        take_strings(source, skip_comma(source, after_string), count - 1, [value | acc])

      :error ->
        :error
    end
  end

  defp parse_string(source, offset) when offset >= byte_size(source), do: :error

  defp parse_string(source, offset) do
    case binary_part(source, offset, 1) do
      <<quote>> when quote in [?", ?'] -> read_string(source, offset + 1, quote, [])
      _ -> :error
    end
  end

  defp read_string(source, offset, _quote, _acc) when offset >= byte_size(source), do: :error

  defp read_string(source, offset, quote, acc) do
    case binary_part(source, offset, 1) do
      <<^quote>> ->
        {:ok, acc |> Enum.reverse() |> IO.iodata_to_binary(), offset + 1}

      <<?\\>> when offset + 1 < byte_size(source) ->
        <<escaped>> = binary_part(source, offset + 1, 1)
        read_string(source, offset + 2, quote, [unescape_char(escaped) | acc])

      <<char>> ->
        read_string(source, offset + 1, quote, [char | acc])
    end
  end

  defp unescape_char(?n), do: ?\n
  defp unescape_char(?t), do: ?\t
  defp unescape_char(char), do: char

  defp skip_ws(source, offset) when offset >= byte_size(source), do: offset

  defp skip_ws(source, offset) do
    case binary_part(source, offset, 1) do
      <<char>> when char in [?\s, ?\t, ?\n, ?\r] -> skip_ws(source, offset + 1)
      _ -> offset
    end
  end

  defp skip_comma(source, offset) do
    offset = skip_ws(source, offset)

    if offset < byte_size(source) and binary_part(source, offset, 1) == <<?,>> do
      skip_ws(source, offset + 1)
    else
      offset
    end
  end

  defp nearby_context(tail) do
    snippet = String.slice(String.trim_leading(tail), 0, 160)

    case Regex.run(~r/^,?\s*\{[^}]*context\s*:\s*(['"])(.*?)\1/, snippet) do
      [_, _quote, value] -> value
      _ -> nil
    end
  end

  defp singular_message(msgid, msgctxt, path, line) do
    %Message{
      msgid: Placeholders.to_gettext(msgid),
      msgctxt: msgctxt,
      references: [{path, line}],
      extracted_comments: ["frontend"]
    }
  end

  defp plural_message(msgid, msgid_plural, msgctxt, path, line) do
    %Message{
      msgid: Placeholders.to_gettext(msgid),
      msgid_plural: Placeholders.to_gettext(msgid_plural),
      msgctxt: msgctxt,
      references: [{path, line}],
      extracted_comments: ["frontend"]
    }
  end

  defp remaining(source, byte_offset) do
    binary_part(source, byte_offset, byte_size(source) - byte_offset)
  end

  defp line_number(source, byte_offset) do
    source
    |> binary_part(0, min(byte_offset, byte_size(source)))
    |> String.split("\n", trim: false)
    |> length()
  end
end
