defmodule OperatelyWeb.Api.ExternalMutations.Mutations.EditSpacePermissions do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "edit_space_permissions"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
  end

  @impl true
  def inputs(ctx) do
    %{
      space_id: Paths.space_id(ctx.space),
      access_levels: %{public: Operately.Access.Binding.no_access(), company: Operately.Access.Binding.edit_access(), space: Operately.Access.Binding.view_access()}
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
