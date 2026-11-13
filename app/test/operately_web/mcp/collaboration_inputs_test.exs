defmodule OperatelyWeb.Mcp.CollaborationInputsTest do
  use ExUnit.Case, async: true

  alias OperatelyWeb.Mcp.CollaborationInputs, as: Inputs

  test "decodes resource levels without accepting company roles or partial replacements" do
    assert {:ok, %{public: 0, company: 10, space: 70}} =
             Inputs.levels(%{"public" => "no_access", "company" => "view_access", "space" => "edit_access"}, true)

    assert {:error, :invalid_arguments} = Inputs.levels(%{"company" => "view_access"}, false)
    assert {:error, :invalid_arguments} = Inputs.level("admin_access")
    assert {:error, :invalid_arguments} = Inputs.level("unknown")
  end

  test "decodes member identifiers and rejects malformed entries" do
    id = Ecto.UUID.generate()
    assert {:ok, [%{id: ^id, access_level: 40}]} = Inputs.members([%{"id" => Operately.ShortUuid.encode!(id), "access_level" => "comment_access"}])
    assert {:error, :invalid_arguments} = Inputs.members([%{"id" => id}])
    assert {:error, :invalid_arguments} = Inputs.members([%{"id" => "%%%", "access_level" => "view_access"}])
    assert {:error, :invalid_arguments} = Inputs.members(nil)
  end
end
