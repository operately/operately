defmodule Operately.I18n.FrontendExtractor do
  @moduledoc false

  alias Operately.I18n.{Message, Placeholders}

  @script Path.expand("../../../priv/i18n/extract_frontend.cjs", __DIR__)

  def extract_file(path), do: extract_files([path])

  def extract_files([]), do: []
  def extract_files(paths), do: run(["--files" | paths])

  def extract_contents(source, path) when is_binary(source) do
    run(["--source", path, source])
  end

  defp run(args) do
    case System.cmd("node", [@script | args], stderr_to_stdout: true) do
      {output, 0} -> output |> Jason.decode!() |> Enum.map(&to_message/1)
      {output, _status} -> raise "Frontend translation extraction failed: #{String.trim(output)}"
    end
  end

  defp to_message(message) do
    %Message{
      msgid: Placeholders.to_gettext(message["msgid"]),
      msgid_plural: if(message["msgid_plural"], do: Placeholders.to_gettext(message["msgid_plural"])),
      msgctxt: message["msgctxt"],
      references: [{message["path"], message["line"]}],
      extracted_comments: ["frontend"]
    }
  end
end
