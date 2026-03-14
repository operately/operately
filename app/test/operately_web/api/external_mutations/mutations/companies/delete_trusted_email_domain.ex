defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Companies.DeleteTrustedEmailDomain do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "companies/delete_trusted_email_domain"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
  end

  @impl true
  def inputs(ctx) do
    %{
      company_id: Paths.company_id(ctx.company),
      domain: "example.com"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.company.id
    refute Map.has_key?(response, :error)
  end
end
