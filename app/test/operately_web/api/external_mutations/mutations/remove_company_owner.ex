defmodule OperatelyWeb.Api.ExternalMutations.Mutations.RemoveCompanyOwner do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "remove_company_owner"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_owner(:owner)

  end

  @impl true
  def inputs(ctx) do
    %{
      person_id: Paths.person_id(ctx.owner)
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
