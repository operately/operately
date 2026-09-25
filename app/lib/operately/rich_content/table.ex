defmodule Operately.RichContent.Table do
  @moduledoc "Readable table text for previews and search, preserving cell and row boundaries."

  def to_plain_text(%{"content" => rows}) do
    Enum.map_join(rows, "\n", fn row ->
      Enum.map_join(row["content"] || [], " | ", fn cell ->
        Enum.map_join(cell["content"] || [], " / ", &inline_text/1)
      end)
    end)
  end

  defp inline_text(%{"type" => "text", "text" => text}), do: String.replace(text, ~r/\r\n?|\n/, " / ")
  defp inline_text(%{"type" => "mention", "attrs" => %{"label" => label}}), do: label
  defp inline_text(%{"type" => "hardBreak"}), do: " / "
  defp inline_text(%{"content" => content}), do: Enum.map_join(content, &inline_text/1)
  defp inline_text(_), do: ""
end
