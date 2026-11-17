defmodule OperatelyWeb.Api.ExternalQueries.Queries.Tasks.ListBoards do
  use Operately.Support.ExternalApi.QuerySpec
  alias Operately.Support.Factory
  alias OperatelyWeb.Paths

  def query_name, do: "tasks/list_boards"

  def setup(ctx), do: ctx |> Factory.setup() |> Factory.add_space(:space)

  def inputs(ctx), do: %{space_id: Paths.space_id(ctx.space)}

  def assert(response, ctx) do
    assert [%{id: id, is_default: true}] = response.boards
    assert id == Operately.ShortUuid.encode!(ctx.space.default_task_board_id)
  end
end
