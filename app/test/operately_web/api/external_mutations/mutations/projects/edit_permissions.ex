defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.EditPermissions do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  @impl true
  def mutation_name, do: "projects/edit_permissions"

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
      access_levels: %{public: Binding.no_access(), company: Binding.edit_access(), space: Binding.view_access()}
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
