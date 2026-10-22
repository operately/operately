defmodule OperatelyWeb.Mcp.Tools.Goals.UpdateCheckTest do
  use Operately.DataCase, async: true

  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Executor
  alias OperatelyWeb.Mcp.Tools.Goals.UpdateCheck
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "call/2 renames a checklist item" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])
      |> Factory.add_goal_check(:check, :goal, name: "Launch the rewrite")

    assert {:ok, %{success: true}} =
             UpdateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => Paths.goal_check_id(ctx.check),
               "name" => "Ship the onboarding rewrite"
             })

    assert ToolConnHelper.reload(ctx.check).name == "Ship the onboarding rewrite"
  end

  test "returns invalid_arguments for a malformed check id" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space, targets: [])

    assert {:error, :invalid_arguments} =
             UpdateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => "definitely-not-a-valid-operately-id-%%%",
               "name" => "Ship the onboarding rewrite"
             })
  end

  test "returns a validation error for an oversized name" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_check(:check, :goal)

    assert {:error, :bad_request, message} =
             UpdateCheck.call(ToolConnHelper.conn(ctx), %{
               "goal_id" => Paths.goal_id(ctx.goal),
               "check_id" => Paths.goal_check_id(ctx.check),
               "name" => String.duplicate("a", 256)
             })

    assert message =~ "255"
    assert UpdateCheck.definition().input_schema["properties"]["name"]["maxLength"] == 255
  end

  test "executor returns localized validation errors for invalid names without changing checks" do
    ctx =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_goal_check(:check, :goal)

    conn = ToolConnHelper.conn(ctx)
    assert {:ok, definition} = Executor.fetch_definition("update_goal_check")
    activities_before = Repo.aggregate(Operately.Activities.Activity, :count)

    for locale <- ["en", "pt_BR"], name <- ["", "   ", String.duplicate("a", 256)] do
      Gettext.with_locale(OperatelyWeb.Gettext, locale, fn ->
        arguments = %{"goal_id" => Paths.goal_id(ctx.goal), "check_id" => Paths.goal_check_id(ctx.check), "name" => name}
        assert {:error, :bad_request, message} = UpdateCheck.call(conn, arguments)

        assert {:ok, result} = Executor.execute(conn, definition, arguments)
        assert result == %{"isError" => true, "content" => [%{"type" => "text", "text" => message}]}
        assert Repo.reload!(ctx.check).name == ctx.check.name
        assert Repo.aggregate(Operately.Activities.Activity, :count) == activities_before
      end)
    end
  end
end
