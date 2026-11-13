defmodule OperatelyWeb.Api.Goals.CheckInInputsTest do
  use ExUnit.Case, async: true
  alias OperatelyWeb.Api.Goals.CheckInInputs

  test "decodes target identifiers and rejects malformed or foreign target values" do
    id = Ecto.UUID.generate()
    encoded_id = Operately.ShortUuid.encode!(id)
    targets = [%{id: id}]
    assert {:ok, [%{"id" => ^id, "value" => 12}]} = CheckInInputs.decode_target_values(Jason.encode!([%{id: encoded_id, value: 12}]), targets)

    for input <- [
          "invalid",
          "{}",
          Jason.encode!([%{id: encoded_id, value: "12"}]),
          Jason.encode!([%{id: Operately.ShortUuid.encode!(Ecto.UUID.generate()), value: 1}]),
          Jason.encode!([%{id: encoded_id, value: 1}, %{id: encoded_id, value: 2}])
        ] do
      assert {:error, :bad_request} = CheckInInputs.decode_target_values(input, targets)
    end

    assert {:ok, nil} = CheckInInputs.decode_target_values(nil, targets)
  end

  test "checklists cannot update checks from another goal" do
    id = Ecto.UUID.generate()
    assert :ok = CheckInInputs.validate_checklist([%{id: id}], [%{id: id}])
    assert {:error, :bad_request} = CheckInInputs.validate_checklist([%{id: id}], [])
    assert {:error, :bad_request} = CheckInInputs.validate_checklist([%{id: id}, %{id: id}], [%{id: id}])
  end
end
