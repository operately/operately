defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Documents.DeleteHub do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  def mutation_name, do: "documents/delete_hub"

  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.fetch_default_resource_hub(:hub, :space)
      |> Factory.add_resource_hub(:other_hub, :space, :creator)

    ctx
  end

  def inputs(ctx), do: %{resource_hub_id: ctx.other_hub.id}

  def assert(response, _ctx), do: assert(response.success)
end
