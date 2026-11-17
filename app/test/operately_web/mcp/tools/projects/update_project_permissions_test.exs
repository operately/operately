defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateProjectPermissionsTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateProjectPermissions, as: Tool
  alias OperatelyWeb.Paths

  test "adapts resource and member inputs and rejects foreign resources" do
    ctx = %{} |> Factory.setup() |> Factory.add_company_member(:member) |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    conn = ToolConnHelper.conn(ctx)

    arguments = %{"project_id" => Paths.project_id(ctx.project), "access_levels" => %{"public" => "no_access", "company" => "comment_access", "space" => "edit_access"}}
    assert {:ok, _} = Tool.call(conn, arguments)

    other = Factory.setup(%{})
    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(other), arguments)
    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(arguments, "project_id", "definitely-not-a-valid-operately-id-%%%"))
  end
end
