defmodule OperatelyWeb.Api.ExternalMutations.Mutations.InviteGuest do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "invite_guest"

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
    assert response.new_account
    assert response.person_id
    refute Map.has_key?(response, :error)
  end
end
