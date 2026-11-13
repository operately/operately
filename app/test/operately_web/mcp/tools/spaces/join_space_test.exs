defmodule OperatelyWeb.Mcp.Tools.Spaces.JoinSpaceTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Spaces.JoinSpace, as: Tool
  alias OperatelyWeb.Paths

  test "adapts resource and member inputs and rejects foreign resources" do
    ctx = %{} |> Factory.setup() |> Factory.add_company_member(:member) |> Factory.add_space(:space, company_permissions: 10)
    conn = ToolConnHelper.conn_as(ctx, :member)
    arguments = %{"space_id" => Paths.space_id(ctx.space)}
    assert {:ok, _} = Tool.call(conn, arguments)
    assert Operately.Repo.get_by(Operately.Groups.Member, group_id: ctx.space.id, person_id: ctx.member.id)
    other = Factory.setup(%{})
    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(other), arguments)
    assert {:error, :invalid_arguments} = Tool.call(conn, Map.put(arguments, "space_id", "definitely-not-a-valid-operately-id-%%%"))
  end
end
