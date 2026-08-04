defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Goals.Create do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding

  @impl true
  def mutation_name, do: "goals/create"

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
      champion_id: Paths.person_id(ctx.creator),
      reviewer_id: Paths.person_id(ctx.creator),
      anonymous_access_level: Binding.no_access(),
      company_access_level: Binding.no_access(),
      space_access_level: Binding.no_access()
    }
  end

  @impl true
  def assert(response, ctx) do
    assert response.goal
    refute Map.has_key?(response, :error)
    assert Operately.Repo.reload(ctx.company).setup_completed
  end
end
