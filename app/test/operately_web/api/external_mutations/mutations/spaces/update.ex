defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.Update do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/update"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)

  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.space_id(ctx.space),
      name: "Updated Name",
      mission: "Updated mission"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.space.id
    refute Map.has_key?(response, :error)
  end
end
