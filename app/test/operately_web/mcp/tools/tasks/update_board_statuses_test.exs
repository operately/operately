defmodule OperatelyWeb.Mcp.Tools.Tasks.UpdateBoardStatusesTest do
  use Operately.DataCase, async: true
  alias Operately.Support.Factory
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.UpdateBoardStatuses

  setup ctx do
    ctx |> Factory.setup() |> Factory.add_space(:space) |> Factory.add_project(:project, :space)
  end

  test "decodes board and status inputs, including replacement mappings", ctx do
    board = Operately.Projects.Project.task_board(ctx.project)
    statuses = board.task_statuses |> Enum.map(&OperatelyWeb.Api.Serializer.serialize/1) |> Jason.encode!() |> Jason.decode!()
    [deleted, replacement | rest] = statuses
    task = Operately.TasksFixtures.task_fixture(%{creator_id: ctx.creator.id, project_id: ctx.project.id})

    args = %{
      "board_id" => Operately.ShortUuid.encode!(board.id),
      "task_statuses" => [replacement | rest],
      "deleted_status_replacements" => [%{"deleted_status_id" => deleted["id"], "replacement_status_id" => replacement["id"]}]
    }

    assert {:ok, %{success: true, board_id: id}} = UpdateBoardStatuses.call(ToolConnHelper.conn(ctx), args)
    assert id == args["board_id"]
    assert Repo.reload!(task).task_status.id == replacement["id"]
  end

  test "rejects malformed inputs and hides cross-company boards", ctx do
    conn = ToolConnHelper.conn(ctx)
    assert {:error, :invalid_arguments} = UpdateBoardStatuses.call(conn, %{"board_id" => "@invalid!", "task_statuses" => []})
    assert {:error, :invalid_arguments} = UpdateBoardStatuses.call(conn, %{"board_id" => ctx.space.default_task_board_id})
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)
    assert {:error, :not_found} = UpdateBoardStatuses.call(conn, %{"board_id" => Operately.ShortUuid.encode!(foreign.space.default_task_board_id), "task_statuses" => []})
  end
end
