defmodule Operately.I18n.Po do
  @moduledoc false

  alias Expo.Message.{Plural, Singular}
  alias Operately.I18n.Message

  @headers [
    "Language: \n",
    "MIME-Version: 1.0\n",
    "Content-Type: text/plain; charset=UTF-8\n",
    "Content-Transfer-Encoding: 8bit\n",
    "Plural-Forms: nplurals=2; plural=(n != 1);\n",
    "X-Generator: Operately I18n\n"
  ]

  def parse(content) when is_binary(content) do
    content
    |> Expo.PO.parse_string!()
    |> Map.fetch!(:messages)
    |> Enum.map(&from_expo/1)
  end

  def parse_file!(path) do
    path
    |> File.read!()
    |> parse()
  end

  def compose(messages, opts \\ []) do
    headers = Keyword.get(opts, :headers, @headers)

    expo_messages =
      messages
      |> Enum.sort_by(&Message.key/1)
      |> Enum.map(&to_expo/1)

    %Expo.Messages{headers: headers, messages: expo_messages}
    |> Expo.PO.compose()
    |> IO.iodata_to_binary()
  end

  def write!(path, messages, opts \\ []) do
    File.mkdir_p!(Path.dirname(path))
    File.write!(path, compose(messages, opts))
  end

  defp from_expo(%Singular{} = message) do
    %Message{
      msgid: join(message.msgid),
      msgctxt: join(message.msgctxt),
      msgstr: join(message.msgstr),
      references: flatten_references(message.references),
      extracted_comments: message.extracted_comments
    }
  end

  defp from_expo(%Plural{} = message) do
    msgstr_plural =
      Map.new(message.msgstr, fn {index, value} -> {index, join(value)} end)

    %Message{
      msgid: join(message.msgid),
      msgid_plural: join(message.msgid_plural),
      msgctxt: join(message.msgctxt),
      msgstr_plural: msgstr_plural,
      references: flatten_references(message.references),
      extracted_comments: message.extracted_comments
    }
  end

  defp to_expo(%Message{msgid_plural: nil} = message) do
    %Singular{
      msgid: [message.msgid],
      msgctxt: context(message.msgctxt),
      msgstr: [message.msgstr || ""],
      references: expo_references(message.references),
      extracted_comments: message.extracted_comments
    }
  end

  defp to_expo(%Message{} = message) do
    msgstr =
      if message.msgstr_plural == %{} do
        %{0 => [""], 1 => [""]}
      else
        Map.new(message.msgstr_plural, fn {index, value} -> {index, [value]} end)
      end

    %Plural{
      msgid: [message.msgid],
      msgid_plural: [message.msgid_plural],
      msgctxt: context(message.msgctxt),
      msgstr: msgstr,
      references: expo_references(message.references),
      extracted_comments: message.extracted_comments
    }
  end

  defp join(nil), do: nil
  defp join([]), do: ""
  defp join(parts) when is_list(parts), do: Enum.join(parts)
  defp join(value) when is_binary(value), do: value

  defp context(nil), do: nil
  defp context(""), do: nil
  defp context(value), do: [value]

  defp flatten_references(references) do
    references
    |> List.flatten()
    |> Enum.map(fn
      {file, line} -> {file, line}
      file when is_binary(file) -> {file, 1}
    end)
  end

  defp expo_references(references) do
    references
    |> Enum.sort()
    |> Enum.map(fn {file, line} -> [{file, line}] end)
  end
end
