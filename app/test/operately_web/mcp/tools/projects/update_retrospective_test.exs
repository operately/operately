defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateRetrospectiveTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.UpdateRetrospective
  alias OperatelyWeb.Mcp.ToolConnHelper

  setup do
    %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space) |> Factory.add_project_retrospective(:retrospective, :project, :creator)
  end

  test "applies the API operation with encoded identifiers", ctx do
    assert {:ok, %{retrospective: retrospective}} =
             UpdateRetrospective.call(ToolConnHelper.conn(ctx), %{"retrospective_id" => Operately.ShortUuid.encode!(ctx.retrospective.id), "content" => "Lessons", "success_status" => "missed"})

    assert ToolConnHelper.rich_text_to_string(retrospective.content) == "Lessons"
  end

  test "rejects malformed identifiers", ctx do
    arguments = %{"retrospective_id" => Operately.ShortUuid.encode!(ctx.retrospective.id), "content" => "Lessons", "success_status" => "missed"} |> Map.put("retrospective_id", "invalid-%%")
    assert {:error, :invalid_arguments} = UpdateRetrospective.call(ToolConnHelper.conn(ctx), arguments)
  end

  test "rejects a resource in another company", ctx do
    other = %{} |> Factory.setup()

    assert {:error, :not_found} =
             UpdateRetrospective.call(ToolConnHelper.conn(other), %{"retrospective_id" => Operately.ShortUuid.encode!(ctx.retrospective.id), "content" => "Lessons", "success_status" => "missed"})
  end
end
