defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditKeyResource do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_key_resource"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> add_key_resource()
  end

  @impl true
  def inputs(ctx) do
    %{
      id: Paths.key_resource_id(ctx.key_resource),
      title: "Updated Title",
      link: "https://example.com"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.key_resource.id
    refute Map.has_key?(response, :error)
  end

  defp add_key_resource(ctx) do
    key_resource = Operately.ProjectsFixtures.key_resource_fixture(%{project_id: ctx.project.id})
    Map.put(ctx, :key_resource, key_resource)
  end
end
