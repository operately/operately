defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Companies.Update do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "companies/update"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
  end

  @impl true
  def inputs(_) do
    %{
      name: "Updated Name"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.company.id
    refute Map.has_key?(response, :error)
  end
end
