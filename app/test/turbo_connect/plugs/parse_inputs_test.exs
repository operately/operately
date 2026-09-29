defmodule TurboConnect.Plugs.ParseInputsTest do
  use ExUnit.Case, async: true

  alias TurboConnect.Plugs.ParseInputs

  test "rejects malformed lists in queries and mutations" do
    for strict <- [false, true], value <- ["not-a-list", %{"url" => "/bad"}, 123, false] do
      assert {:error, 400, _} = ParseInputs.parse_input({:list, :string}, %{}, value, strict)
    end
  end

  test "preserves supported empty list representations" do
    for strict <- [false, true], value <- [[], nil] do
      assert {:ok, []} = ParseInputs.parse_input({:list, :string}, %{}, value, strict)
    end

    assert {:ok, []} = ParseInputs.parse_input({:list, :string}, %{}, "", false)
    assert {:error, 400, _} = ParseInputs.parse_input({:list, :string}, %{}, "", true)
  end

  test "atomizes keys that already exist as atoms" do
    assert ParseInputs.atomize_keys(%{"id" => "1"}) == %{id: "1"}
  end

  test "keeps unknown keys as strings instead of raising" do
    result = ParseInputs.atomize_keys(%{"id" => "1", "zzq_unknown_input_field" => "x"})

    assert result.id == "1"
    assert result["zzq_unknown_input_field"] == "x"
  end

  test "keeps unknown keys as strings in nested maps" do
    result = ParseInputs.atomize_keys(%{"address" => %{"zzq_unknown_input_field" => "x"}})

    assert result.address["zzq_unknown_input_field"] == "x"
  end
end
