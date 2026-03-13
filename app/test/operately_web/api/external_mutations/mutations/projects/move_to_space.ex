defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.MoveToSpace do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "projects/move_to_space"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_space(:target_space)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      space_id: Paths.space_id(ctx.target_space)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
