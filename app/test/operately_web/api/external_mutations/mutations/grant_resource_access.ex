defmodule OperatelyWeb.Api.ExternalMutations.Mutations.GrantResourceAccess do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "grant_resource_access"

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
      person_id: ctx.member.id,
      resources: [
        %{
          resource_type: "project",
          resource_id: Paths.project_id(ctx.project),
          access_level: "view_access"
        }
      ]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
