defmodule Operately.RichContent.TableTest do
  use ExUnit.Case, async: true

  @fixtures "test/fixtures/rich_text/tables.json" |> File.read!() |> Jason.decode!()

  for fixture <- @fixtures do
    @fixture fixture
    test "extracts #{@fixture["name"]} with full mention labels and cell boundaries" do
      table = Enum.at(@fixture["document"]["content"], 1)
      assert Operately.RichContent.Table.to_plain_text(table) == @fixture["tableText"]
    end
  end
end
