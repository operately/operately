defmodule TurboConnect.Plugs.ParseInputsTest do
  use ExUnit.Case, async: true

  alias TurboConnect.Plugs.ParseInputs

  test "translated input errors preserve field names and invalid enum values" do
    Gettext.with_locale(OperatelyWeb.Gettext, "pt_BR", fn ->
      assert {:error, 400, "Campo de entrada desconhecido: unknown_field"} = ParseInputs.find_field([], "unknown_field")
      types = %{primitives: %{}, objects: %{}, enums: %{example: [:one]}, int_enums: %{}}
      assert {:error, 400, message} = ParseInputs.parse_input(:example, types, "literal-invalid-value", true)
      assert message == "Valor inválido para o enum example: literal-invalid-value. Valores permitidos: one"
    end)
  end

  test "rejects malformed query integers without returning a server error" do
    types = %{primitives: %{}, objects: %{}, enums: %{}, int_enums: %{}}

    for value <- ["abc", "1.5", ["20"], %{"value" => "20"}] do
      assert {:error, 400, _} = ParseInputs.parse_input(:integer, types, value, false)
    end

    assert {:ok, 20} = ParseInputs.parse_input(:integer, types, "20", false)
  end

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
