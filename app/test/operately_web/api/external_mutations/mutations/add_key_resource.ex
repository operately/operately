defmodule OperatelyWeb.Api.ExternalMutations.Mutations.AddKeyResource do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "add_key_resource"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      title: "Updated Title",
      link: "https://example.com"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.key_resource.id
    refute Map.has_key?(response, :error)
  end
end
