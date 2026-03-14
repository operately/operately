defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Companies.DeleteAdmin do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "companies/delete_admin"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_admin(:admin)

  end

  @impl true
  def inputs(ctx) do
    %{
      person_id: Paths.person_id(ctx.admin)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.person.id
    refute Map.has_key?(response, :error)
  end
end
