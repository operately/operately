defmodule OperatelyWeb.Mcp.Tools.Spaces.UpdateSpacePermissionsTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Spaces.UpdateSpacePermissions, as: Tool
  alias OperatelyWeb.Paths

  test "adapts resource and member inputs and rejects foreign resources" do
    ctx = %{} |> Factory.setup() |> Factory.add_company_member(:member) |> Factory.add_space(:space)
    conn = ToolConnHelper.conn(ctx)

    arguments = %{"space_id" => Paths.space_id(ctx.space), "access_levels" => %{"public" => "no_access", "company" => "comment_access"}}
    assert {:ok, _} = Tool.call(conn, arguments)

    for unsupported <- ["comment_access", "edit_access", "full_access"] do
      assert {:error, :invalid_arguments} = Tool.call(conn, put_in(arguments, ["access_levels", "public"], unsupported))
    end

    assert {:ok, _} = Tool.call(conn, put_in(arguments, ["access_levels", "public"], "view_access"))
    assert {:ok, %{space: space}} = OperatelyWeb.Api.Spaces.Get.call(conn, %{id: ctx.space.id, include_access_levels: true})
    assert space.access_levels.public == 10

    other = Factory.setup(%{})
    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(other), arguments)
    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(arguments, "space_id", "definitely-not-a-valid-operately-id-%%%"))
  end
end
