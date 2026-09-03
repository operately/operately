defmodule TurboConnect.Plugs.ParseInputsTest do
  use ExUnit.Case, async: true

  alias TurboConnect.Plugs.ParseInputs

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
