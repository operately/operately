defmodule OperatelyWeb.Mcp.Tools.Projects.UpdateCheckInTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.Tools.Projects.{CreateCheckIn, UpdateCheckIn, GetCheckIn}
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Paths

  test "rejects malformed and cross-company check-in identifiers" do
    ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
    conn = ToolConnHelper.conn(ctx)
    assert {:ok, %{check_in: check_in}} = CreateCheckIn.call(conn, %{"project_id" => Paths.project_id(ctx.project), "status" => "on_track", "content" => "Update"})
    arguments = %{"check_in_id" => check_in.id, "status" => "on_track", "content" => "Correction"}
    assert {:error, :invalid_arguments} = UpdateCheckIn.call(conn, Map.put(arguments, "check_in_id", "invalid-%%"))
    other = %{} |> Factory.setup()
    assert {:error, :not_found} = UpdateCheckIn.call(ToolConnHelper.conn(other), arguments)
  end

  test "edits, schedules, and publishes a draft check-in" do
    Oban.Testing.with_testing_mode(:manual, fn ->
      ctx = %{} |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
      conn = ToolConnHelper.conn(ctx)

      assert {:ok, %{check_in: draft}} =
               CreateCheckIn.call(conn, %{
                 "project_id" => Paths.project_id(ctx.project),
                 "status" => "on_track",
                 "content" => "Draft",
                 "post_as_draft" => true
               })

      assert draft.state == "draft"
      scheduled_at = DateTime.utc_now() |> DateTime.add(3600) |> DateTime.truncate(:second) |> DateTime.to_iso8601()

      assert {:ok, %{check_in: scheduled}} =
               UpdateCheckIn.call(conn, %{
                 "check_in_id" => draft.id,
                 "status" => "caution",
                 "content" => "Revised",
                 "scheduled_at" => scheduled_at
               })

      assert scheduled.state == "scheduled"
      assert {:ok, %{check_in: edited}} = UpdateCheckIn.call(conn, %{"check_in_id" => draft.id, "status" => "caution", "content" => "Revised again"})
      assert edited.state == "scheduled"
      assert edited.scheduled_at == scheduled.scheduled_at
      assert {:ok, %{check_in: published}} = UpdateCheckIn.call(conn, %{"check_in_id" => draft.id, "status" => "on_track", "content" => "Published", "state" => "published"})
      assert published.state == "published"
      assert {:ok, %{check_in: fetched}} = GetCheckIn.call(conn, %{"check_in_id" => draft.id})
      assert fetched.id == published.id
    end)
  end
end
