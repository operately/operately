defmodule OperatelyWeb.Api.ExternalQueries.Queries.Tasks.GetBoard do
  use Operately.Support.ExternalApi.QuerySpec
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "tasks/get_board"

  def setup(ctx), do: ctx |> Factory.setup() |> Factory.add_space(:space)

  def inputs(ctx), do: %{space_id: Paths.space_id(ctx.space), board_id: Operately.ShortUuid.encode!(ctx.space.default_task_board_id)}

  def assert(response, ctx) do
    assert response.board.id == Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
    assert response.board.name == "Tasks"
    assert is_list(response.board.task_statuses)
    assert is_map(response.board.tasks_kanban_state)
  end
end
