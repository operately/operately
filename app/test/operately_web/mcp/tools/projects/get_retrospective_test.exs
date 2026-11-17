defmodule OperatelyWeb.Mcp.Tools.Projects.GetRetrospectiveTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.GetRetrospective
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space) |> Factory.add_project_retrospective(:retrospective, :project, :creator)
  end

  test "applies the API operation with encoded identifiers", ctx do
    assert {:ok, %{retrospective: retrospective}} = GetRetrospective.call(ToolConnHelper.conn(ctx), %{"project_id" => Paths.project_id(ctx.project)})
    assert ToolConnHelper.decode_id!(retrospective.id) == ctx.retrospective.id
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"project_id" => Paths.project_id(ctx.project)} |> Map.put("project_id", "invalid-%%")
    assert {:error, :invalid_arguments} = GetRetrospective.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "rejects a resource in another company", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = GetRetrospective.call(ToolConnHelper.conn(other), %{"project_id" => Paths.project_id(ctx.project)})
  end
end
