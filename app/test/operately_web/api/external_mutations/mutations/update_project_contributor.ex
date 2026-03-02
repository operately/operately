defmodule OperatelyWeb.Api.ExternalMutations.Mutations.UpdateProjectContributor do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "update_project_contributor"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_project(:project, :space)
    |> Factory.add_project_contributor(:project_contributor, :project)
    |> Factory.add_company_member(:member)
  end

  @impl true
  def inputs(ctx) do
    %{
      contrib_id: Paths.project_contributor_id(ctx.project_contributor),
      person_id: Paths.person_id(ctx.member),
      responsibility: "Updated responsibility",
      permissions: "edit_access"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.contributor.id
    refute Map.has_key?(response, :error)
  end
end
