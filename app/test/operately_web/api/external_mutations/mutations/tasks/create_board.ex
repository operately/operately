defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Tasks.CreateBoard do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "tasks/create_board"

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    ctx
  end

  def inputs(ctx), do: %{space_id: ctx.space.id, name: "Design"}

  def assert(response, _ctx), do: assert(response.board.id)
end
