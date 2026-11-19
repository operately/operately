defmodule OperatelyWeb.Mcp.Tools.Milestones.ListTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Milestones.List
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  setup do
    %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space) |> Factory.add_project_milestone(:milestone, :project) |> Factory.add_project_task(:task, :milestone)
  end

  test "applies the API operation with encoded identifiers", ctx do
    assert {:ok, %{milestones: [milestone]}} = List.call(ToolConnHelper.conn(ctx), %{"project_id" => Paths.project_id(ctx.project)})
    assert ToolConnHelper.decode_id!(milestone.id) == ctx.milestone.id
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"project_id" => Paths.project_id(ctx.project)} |> Map.put("project_id", "invalid-%%")
    assert {:error, :invalid_arguments} = List.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "rejects a resource in another company", ctx do
    other = %{} |> Factory.setup()
    assert {:error, :not_found, _} = List.call(ToolConnHelper.conn(other), %{"project_id" => Paths.project_id(ctx.project)})
  end
end
