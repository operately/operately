defmodule OperatelyWeb.Mcp.Tools.Tasks.MoveTest do
  use Operately.DataCase, async: true

  alias Operately.ShortUuid
  alias Operately.Support.Factory
  alias Operately.Tasks.TaskBoard
  alias OperatelyWeb.Mcp.ToolConnHelper
  alias OperatelyWeb.Mcp.Tools.Tasks.Move
  alias OperatelyWeb.Paths

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.set_space_tools(:space, tasks_enabled: true)
    |> Factory.create_space_task(:task, :space)
  end

  test "decodes board destinations and forwards explicit status mappings", ctx do
    status = %{id: "review", label: "Review", value: "review", color: :blue, index: 0, closed: false}
    board = Repo.insert!(TaskBoard.changeset(%{space_id: ctx.space.id, name: "Review", task_statuses: [status]}))
    conn = ToolConnHelper.conn(ctx)

    arguments = %{
      "task_id" => Paths.task_id(ctx.task),
      "destination_type" => "space",
      "destination_id" => Paths.space_id(ctx.space),
      "destination_board_id" => ShortUuid.encode!(board.id)
    }

    assert {:error, :bad_request, _message, details} = Move.call(conn, arguments)
    assert details.code == "task_board_status_mapping_required"
    assert [%{id: "review"}] = details.task_statuses

    assert {:ok, response} = Move.call(conn, Map.put(arguments, "destination_status_id", "review"))
    assert response.board_id == ShortUuid.encode!(board.id)
    assert response.task.status.id == "review"
    assert Repo.reload!(ctx.task).board_id == board.id
  end

  test "uses the destination default when optional selectors are omitted", ctx do
    ctx = ctx |> Factory.add_space(:destination) |> Factory.set_space_tools(:destination, tasks_enabled: true)

    assert {:ok, response} =
             Move.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "destination_type" => "space",
               "destination_id" => Paths.space_id(ctx.destination)
             })

    assert response.board_id == ShortUuid.encode!(ctx.destination.default_task_board_id)
    assert Repo.reload!(ctx.task).space_id == ctx.destination.id
  end

  test "decodes project destinations and returns a null board ID", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert {:ok, response} =
             Move.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "destination_type" => "project",
               "destination_id" => Paths.project_id(ctx.project)
             })

    assert response.board_id == nil
    assert Repo.reload!(ctx.task).project_id == ctx.project.id
  end

  test "rejects malformed identifiers and destination types", ctx do
    arguments = %{
      "task_id" => Paths.task_id(ctx.task),
      "destination_type" => "space",
      "destination_id" => Paths.space_id(ctx.space)
    }

    for field <- ["task_id", "destination_id", "destination_board_id", "destination_type"] do
      assert {:error, :invalid_arguments} = Move.call(ToolConnHelper.conn(ctx), Map.put(arguments, field, "@invalid!"))
    end
  end

  test "returns not_found for a destination board in another company", ctx do
    foreign = Factory.setup(%{}) |> Factory.add_space(:space)

    assert {:error, :not_found} =
             Move.call(ToolConnHelper.conn(ctx), %{
               "task_id" => Paths.task_id(ctx.task),
               "destination_type" => "space",
               "destination_id" => Paths.space_id(ctx.space),
               "destination_board_id" => ShortUuid.encode!(foreign.space.default_task_board_id)
             })

    assert Repo.reload!(ctx.task).board_id == ctx.task.board_id
  end
end
