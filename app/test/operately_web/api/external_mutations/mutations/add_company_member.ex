defmodule OperatelyWeb.Api.ExternalMutations.Mutations.AddCompanyMember do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "add_company_member"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
  end

  @impl true
  def inputs(_) do
    %{
      full_name: "External Member",
      email: "member@example.com",
      title: "Updated Title"
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.invite_link
    assert response.new_account
    refute Map.has_key?(response, :error)
  end
end
