defmodule OperatelyWeb.Api.ExternalMutations.Mutations.AddCompanyAdmins do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "add_company_admins"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_company_member(:member)
  end

  @impl true
  def inputs(ctx) do
    %{
      people_ids: [Paths.person_id(ctx.member)]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert is_map(response)
    refute Map.has_key?(response, :error)
  end
end
