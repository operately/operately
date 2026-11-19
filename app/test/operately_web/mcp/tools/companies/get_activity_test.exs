defmodule OperatelyWeb.Mcp.Tools.Companies.GetActivityTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Companies.GetActivity, as: Tool
  alias OperatelyWeb.Paths

  test "adapts activity IDs and rejects inaccessible resources" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    activity = Repo.one!(from a in Operately.Activities.Activity, where: a.action == "project_created" and fragment("?->>'project_id'", a.content) == ^ctx.project.id)
    args = %{"activity_id" => Paths.activity_id(activity)}

    assert {:error, :not_found} = Tool.call(ToolConnHelper.conn(Factory.setup(%{})), args)
    assert {:error, :invalid_arguments} = Tool.call(ToolConnHelper.conn(ctx), %{"activity_id" => "invalid-%%"})
    assert {:ok, %{activity: result}} = Tool.call(ToolConnHelper.conn(ctx), args)

    assert result.id == Paths.activity_id(activity)
    assert result.action == "project_created"
  end
end
