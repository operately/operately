defmodule Operately.MD.TableTest do
  use ExUnit.Case, async: true

  @fixtures "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!()

  for fixture <- @fixtures do
    @fixture fixture
    test "exports #{@fixture["name"]}" do
      table = Enum.at(@fixture["document"]["content"], 1)
      expected = @fixture["markdown"] |> String.replace_prefix("Before\n\n", "") |> String.replace_suffix("\n\nAfter", "")
      assert Operately.MD.Table.render(table) == expected
    end
  end

  test "empty tables export as empty text" do
    assert Operately.MD.Table.render(%{"type" => "table", "content" => []}) == ""
  end
end
