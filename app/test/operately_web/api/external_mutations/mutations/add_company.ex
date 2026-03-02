defmodule OperatelyWeb.Api.ExternalMutations.Mutations.AddCompany do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "add_company"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
  end

  @impl true
  def inputs(_) do
    %{
      company_name: "Updated Name",
      title: "Updated Title"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.company.id
    refute Map.has_key?(response, :error)
  end
end
