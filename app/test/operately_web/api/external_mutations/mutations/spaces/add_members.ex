defmodule OperatelyWeb.Api.ExternalMutations.Mutations.Spaces.AddMembers do
  use Operately.Support.ExternalApi.MutationSpec
  use OperatelyWeb.TurboCase

  @impl true
  def mutation_name, do: "spaces/add_members"

  @impl true
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_company_member(:member)
  end

  @impl true
  def inputs(ctx) do
    %{
      space_id: Paths.space_id(ctx.space),
      members: [
        %{
          id: Paths.person_id(ctx.member),
          access_level: Operately.Access.Binding.comment_access()
        }
      ]
    }
  end

  @impl true
  def assert(response, _ctx) do
    assert response.success
    refute Map.has_key?(response, :error)
  end
end
