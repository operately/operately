defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.RenameBoard do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "tasks/rename_board"

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    ctx
  end

  def inputs(ctx), do: %{board_id: ctx.space.default_task_board_id, new_name: "Design"}

  def assert(response, _ctx), do: assert(response.success)
end
