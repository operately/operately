defmodule OperatelyWeb.Api.ExternalMutations.Mutations.AddProjectContributor do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "add_project_contributor"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_company_member(:member)
  end

  @impl true
  def inputs(ctx) do
    %{
      project_id: Paths.project_id(ctx.project),
      person_id: Paths.person_id(ctx.member),
      responsibility: "Help",
      permissions: "edit_access",
      role: "contributor"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.contributor.id
    refute Map.has_key?(response, :error)
  end
end
