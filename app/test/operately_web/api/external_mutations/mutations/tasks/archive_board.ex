defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.ArchiveBoard do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "tasks/archive_board"

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    {:ok, board} = Operately.Operations.TaskBoardCreating.run(ctx.creator, ctx.space, "Other")
    Map.put(ctx, :board, board)
  end

  def inputs(ctx), do: %{space_id: ctx.space.id, board_id: ctx.board.id}

  def assert(response, _ctx), do: assert(response.success)
end
