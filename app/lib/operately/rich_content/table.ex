defmodule Operately.RichContent.Table do
  @moduledoc "Readable table text for previews and search, preserving cell and row boundaries."

  def to_plain_text(%{"content" => rows}, opts \\ []) do
    file_label = Keyword.get(opts, :file_label, "File")

    Enum.map_join(rows, "\n", fn row ->
      Enum.map_join(row["content"] || [], " | ", fn cell ->
        Enum.map_join(cell["content"] || [], " / ", &inline_text(&1, file_label))
      end)
    end)
  end

  defp inline_text(%{"type" => "text", "text" => text}, _file_label), do: String.replace(text, ~r/\r\n?|\n/, " / ")
  defp inline_text(%{"type" => "mention", "attrs" => %{"label" => label}}, _file_label), do: label
  defp inline_text(%{"type" => "blob", "attrs" => attrs}, file_label), do: attrs["title"] || attrs["alt"] || file_label
  defp inline_text(%{"type" => "hardBreak"}, _file_label), do: " / "
  defp inline_text(%{"content" => content}, file_label), do: Enum.map_join(content, &inline_text(&1, file_label))
  defp inline_text(_, _file_label), do: ""
end
