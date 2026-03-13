defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.Create do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/create"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
  end

  @impl true
  def inputs(_) do
    %{
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
