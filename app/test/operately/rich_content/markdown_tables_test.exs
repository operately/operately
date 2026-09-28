defmodule Operately.RichContent.MarkdownTablesTest do
  use ExUnit.Case, async: true

  alias Operately.RichContent.MarkdownTables

  @fixtures "test/fixtures/rich_text/table_imports.json" |> File.read!() |> Jason.decode!()

  for fixture <- @fixtures do
    @fixture fixture
    test @fixture["name"] do
      result = MarkdownTables.parse(@fixture["markdown"], fn _ -> [] end, [])

      if @fixture["invalid"] do
        assert result == {:error, :invalid_arguments}
      else
        assert {:ok, [table]} = result
        cells = Enum.map(table["content"], fn row -> Enum.map(row["content"], &cell_text/1) end)
        assert cells == @fixture["cells"]
        marks = table |> all_marks() |> Enum.uniq()
        assert Enum.sort(marks) == Enum.sort(@fixture["marks"])
      end
    end
  end

  test "does not interpret indented code or invalid separators as a table" do
    for markdown <- ["    | A |\n    | --- |", "| A | B |\n| --- |", "| A |\n| not a separator |"] do
      assert {:ok, []} = MarkdownTables.parse(markdown, fn _ -> [] end, [])
    end
  end

  defp cell_text(cell) do
    cell["content"]
    |> hd()
    |> Map.fetch!("content")
    |> Enum.map_join(fn
      %{"type" => "hardBreak"} -> "\n"
      node -> node["text"]
    end)
  end

  defp all_marks(node) do
    Enum.map(node["marks"] || [], & &1["type"]) ++ Enum.flat_map(node["content"] || [], &all_marks/1)
  end
end
