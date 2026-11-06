defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Documents.CreateHub do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "documents/create_hub"

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_resource_hub(:other_hub, :space, :creator)

    ctx
  end

  def inputs(ctx), do: %{space_id: ctx.space.id, name: "Design"}

  def assert(response, _ctx), do: assert(response.hub.id)
end
