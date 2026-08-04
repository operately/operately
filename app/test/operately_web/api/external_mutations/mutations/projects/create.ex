defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Projects.Create do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "projects/create"

  @impl true
  def setup(ctx) do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)

    {:ok, company} = Operately.Companies.update_company(ctx.company, %{setup_completed: false})
    %{ctx | company: company}
  end

  @impl true
  def inputs(ctx) do
    %{
      space_id: Paths.space_id(ctx.space),
      name: "Updated Name",
      anonymous_access_level: Operately.Access.Binding.no_access(),
      company_access_level: Operately.Access.Binding.view_access(),
      space_access_level: Operately.Access.Binding.edit_access()
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.project.id
    refute Map.has_key?(response, :error)
    assert Operately.Repo.reload(ctx.company).setup_completed
  end
end
